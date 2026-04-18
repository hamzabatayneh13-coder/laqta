import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuctionsScheduler {
  constructor(private prisma: PrismaService) {}

  // Runs every 10 seconds
  @Cron(CronExpression.EVERY_10_SECONDS)
  async tick() {
    const now = new Date();

    // 1) Start auctions that should be live
    await this.prisma.auction.updateMany({
      where: {
        status: 'SCHEDULED' as any,
        startsAt: { lte: now } as any,
        endsAt: { gt: now } as any,
      } as any,
      data: { status: 'LIVE' as any } as any,
    });

    // 2) End auctions that passed endsAt
    await this.prisma.auction.updateMany({
      where: {
        status: 'LIVE' as any,
        endsAt: { lte: now } as any,
      } as any,
      data: { status: 'ENDED_PENDING_PAYMENT' as any } as any,
    });
  }
}
