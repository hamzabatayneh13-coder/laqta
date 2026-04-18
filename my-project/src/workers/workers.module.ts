import { Module } from '@nestjs/common';
import { EndAuctionsWorker } from './end-auctions.worker';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrdersModule],
  providers: [EndAuctionsWorker],
})
export class WorkersModule {}