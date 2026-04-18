import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async listMyBids(userId: string) {
    const id = BigInt(userId);

    const bids: any[] = await this.prisma.bid.findMany({
      where: { userId: id as any },
      orderBy: { createdAt: 'desc' } as any,
      take: 200,
      include: {
        auction: {
          include: {
            listing: { include: { category: true } },
          },
        },
      },
    });

    return bids.map((b: any) => ({
      id: b.id.toString(),
      amount: b.amount?.toString(),
      createdAt: b.createdAt,
      auction: b.auction
        ? {
            id: b.auction.id.toString(),
            title: b.auction.listing?.title ?? `Auction #${b.auction.id}`,
            status: b.auction.status,
            location: b.auction.listing?.location ?? 'Jordan', // ✅ your page reads auction.location
          }
        : null,
    }));
  }
}
