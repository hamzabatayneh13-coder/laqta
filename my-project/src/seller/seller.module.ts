import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';

@Module({
  imports: [PrismaModule],
  controllers: [SellerController],
  providers: [SellerService],
})
export class SellerModule {}
