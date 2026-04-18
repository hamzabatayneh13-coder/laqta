import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Server } from 'socket.io';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuctionsService {
  constructor(private prisma: PrismaService) {}

  // list live auctions (for /api/auctions/live)
  listLive() {
    return this.prisma.auction.findMany({
      where: { status: 'LIVE' as any },
      orderBy: { endsAt: 'asc' },
      include: {
        listing: { include: { media: true, category: true } },
        _count: { select: { bids: true } },
      },
      take: 50,
    });
  }

  // ✅ include bids for bid history (latest first) + return minNextBid for UI
  async getAuction(id: bigint) {
    const a: any = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        listing: { include: { media: true, category: true } },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, amount: true, createdAt: true },
        },
      },
    });

    if (!a) throw new NotFoundException('Auction not found');

    const current = new Prisma.Decimal(a.currentPrice ?? 0);
    const step = new Prisma.Decimal(a.bidStep ?? 1);
    const minNextBid = current.plus(step);

    // return same object but with computed minNextBid (string for safe JSON)
    return {
      ...a,
      minNextBid: minNextBid.toString(),
    };
  }

  async placeBid(auctionId: any, userId: any, amount: number, io: Server) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const auction: any = await tx.auction.findUnique({
        where: { id: BigInt(auctionId) },
      });

      if (!auction) throw new NotFoundException('Auction not found');
      if (auction.status !== 'LIVE') throw new BadRequestException('Auction not live');

      const endsAt = new Date(auction.endsAt);
      if (now >= endsAt) throw new BadRequestException('Auction ended');

      const current = new Prisma.Decimal(auction.currentPrice);
      const step = new Prisma.Decimal(auction.bidStep);
      const minBid = current.plus(step);

      const bidAmount = new Prisma.Decimal(amount);

      if (bidAmount.lessThan(minBid)) {
        throw new BadRequestException(`Bid must be >= ${minBid.toFixed(0)}`);
      }

      // ✅ Create bid
      const bid = await tx.bid.create({
        data: {
          auctionId: BigInt(auctionId),
          userId: BigInt(userId),
          amount: bidAmount,
        } as any,
        select: { id: true, amount: true, createdAt: true },
      });

      // ✅ Notify previous winner they were outbid
      const previousWinnerId = auction.currentWinnerUserId?.toString();
      if (previousWinnerId && previousWinnerId !== userId.toString()) {
        if (io) {
          io.to(`user:${previousWinnerId}`).emit('auction:outbid', {
            auctionId: auctionId.toString(),
            newAmount: amount,
          });
        }
      }

      // Anti-sniping
      let newEndsAt = endsAt;
      if (auction.antiSnipingEnabled) {
        const secondsLeft = (newEndsAt.getTime() - now.getTime()) / 1000;
        if (secondsLeft <= Number(auction.antiSnipingLastSeconds || 0)) {
          newEndsAt = new Date(
            newEndsAt.getTime() + Number(auction.antiSnipingExtendSeconds || 0) * 1000,
          );
        }
      }

      // Final Update
      const updated: any = await tx.auction.update({
        where: { id: BigInt(auctionId) },
        data: {
          currentPrice: bidAmount,
          currentWinnerUserId: BigInt(userId),
          endsAt: newEndsAt,
        } as any,
      });

      // ✅ Socket Emit includes bid info
      if (io) {
        io.to(`auction:${auctionId.toString()}`).emit('auction:bid_update', {
          auctionId: auctionId.toString(),
          currentPrice: bidAmount.toString(),
          winnerUserId: userId.toString(),
          endsAt: updated.endsAt,
          bid: {
            id: bid.id.toString(),
            amount: bid.amount.toString(),
            createdAt: bid.createdAt,
          },
        });
      }

      // ✅ Return updated auction + latest bids
      const fresh: any = await tx.auction.findUnique({
        where: { id: BigInt(auctionId) },
        include: {
          listing: { include: { media: true, category: true } },
          bids: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, amount: true, createdAt: true },
          },
        },
      });

      // recompute minNextBid for UI
      const freshCurrent = new Prisma.Decimal(fresh.currentPrice ?? 0);
      const freshStep = new Prisma.Decimal(fresh.bidStep ?? 1);
      const freshMinNextBid = freshCurrent.plus(freshStep);

      return {
        ...fresh,
        minNextBid: freshMinNextBid.toString(),
      };
    });
  }
}
