import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { AuctionsModule } from './auctions/auctions.module';
import { OrdersModule } from './orders/orders.module';
import { KycModule } from './kyc/kyc.module';
import { DisputesModule } from './disputes/disputes.module';
import { AdminModule } from './admin/admin.module';
import { WorkersModule } from './workers/workers.module';
import { BidsModule } from './bids/bids.module';
import { SellerModule } from './seller/seller.module';
import { CategoriesModule } from './categories/categories.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    BidsModule,
    UsersModule,
    SellerModule,
    CategoriesModule,
    ListingsModule,
    AuctionsModule,
    OrdersModule,
    KycModule,
    DisputesModule,
    AdminModule,
    WorkersModule,
  ],
})
export class AppModule {}