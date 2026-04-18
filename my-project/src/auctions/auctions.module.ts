import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { AuctionsGateway } from './auctions.gateway';
import { AuctionsScheduler } from './auctions.scheduler';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // ✅ add this
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway, AuctionsScheduler],
  exports: [AuctionsService],
})
export class AuctionsModule {}