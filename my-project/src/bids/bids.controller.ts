import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api/bids')
export class BidsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const userId = BigInt(req.user.sub);

    const bids = await this.prisma.bid.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        auction: {
          select: {
            id: true,
            endsAt: true,
            status: true,
            listing: { select: { title: true, location: true } },
          },
        },
      },
    });

    return bids.map((b: any) => ({
      id: b.id.toString(),
      amount: b.amount.toString(),
      createdAt: b.createdAt,
      auction: {
        id: b.auction.id.toString(),
        status: b.auction.status,
        endsAt: b.auction.endsAt,
        title: b.auction.listing?.title ?? `Auction #${b.auction.id.toString()}`,
        location: b.auction.listing?.location ?? 'Jordan',
      },
    }));
  }
}
