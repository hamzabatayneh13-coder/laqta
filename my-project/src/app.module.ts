import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../prisma/prisma.module";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ListingsModule } from "./listings/listings.module";
import { AuctionsModule } from "./auctions/auctions.module";
import { OrdersModule } from "./orders/orders.module";
import { DisputesModule } from "./disputes/disputes.module";
import { AdminModule } from "./admin/admin.module";
import { WorkersModule } from "./workers/workers.module";
import { BidsModule } from "./bids/bids.module";
import { SellerModule } from "./seller/seller.module";
import { CategoriesModule } from "./categories/categories.module";
import { PublicModule } from "./public/public.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    PublicModule,
    BidsModule,
    UsersModule,
    SellerModule,
    CategoriesModule,
    ListingsModule,
    AuctionsModule,
    OrdersModule,
    DisputesModule,
    AdminModule,
    WorkersModule,
  ],
})
export class AppModule {}
