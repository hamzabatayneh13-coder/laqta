import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';

@Module({
  controllers: [BidsController],
  providers: [BidsService, PrismaService],
})
export class BidsModule {}
