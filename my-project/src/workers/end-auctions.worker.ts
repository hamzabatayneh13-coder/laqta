import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class EndAuctionsWorker {
  private readonly logger = new Logger(EndAuctionsWorker.name);

  constructor(private prisma: PrismaService, private orders: OrdersService) {}

  // every 30 seconds
  @Cron('*/30 * * * * *')
  async run() {
    try {
      const now = new Date();

      const ended = await this.prisma.auction.findMany({
        where: { status: 'LIVE' as any, endsAt: { lt: now } as any } as any,
        take: 20,
      });

      for (const a of ended) {
        await this.prisma.auction.update({
          where: { id: a.id },
          data: { status: 'ENDED_PENDING_PAYMENT' as any } as any,
        });

        if (a.currentWinnerUserId) {
          const existing = await this.prisma.order.findUnique({
            where: { auctionId: a.id } as any,
          });

          if (!existing) await this.orders.createOrderFromAuction(a.id);
        }
      }
    } catch (err: any) {
      this.logger.error(`EndAuctionsWorker failed: ${err?.code ?? err?.message ?? err}`);
    }
  }
}
