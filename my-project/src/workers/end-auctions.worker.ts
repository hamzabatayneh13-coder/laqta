import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class EndAuctionsWorker {
    constructor(private prisma: PrismaService, private orders: OrdersService) {}

    // every 30 seconds
    @Cron('*/30 * * * * *')
    async run() {
        const now = new Date();
        const ended = await this.prisma.auction.findMany({
            where: { status: 'LIVE', endsAt: { lt: now } },
            take: 20,
        });

        for (const a of ended) {
            await this.prisma.auction.update({
                where: { id: a.id },
                data: { status: 'ENDED_PENDING_PAYMENT' }
            });
            if (a.currentWinnerUserId) {
                // create order if doesn't exist
                const existing = await this.prisma.order.findUnique({ where: { auctionId: a.id } });
                if (!existing) await this.orders.createOrderFromAuction(a.id);
            }
        }
    }
}