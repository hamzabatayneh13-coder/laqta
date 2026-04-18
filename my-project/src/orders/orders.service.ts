import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}

    async createOrderFromAuction(auctionId: bigint) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) throw new BadRequestException('Auction not found');
    if (!auction.currentWinnerUserId) throw new BadRequestException('No winner');

    const threshold = Number(process.env.HIGH_VALUE_JOD || 1000);
    const finalPrice = Number(auction.currentPrice);
    const highValue = finalPrice >= threshold;

    // Seller COD preference
    const sellerProfile = await this.prisma.sellerProfile.findUnique({ where: { userId: auction.sellerId } });
    const allowsCod = sellerProfile?.allowsCod ?? true;

    const paymentMethod = highValue ? 'ESCROW' : 'COD';
    const status = paymentMethod === 'COD' ? 'COD_CONFIRMED' : 'PAYMENT_PENDING';

    return this.prisma.order.create({
    data: {
    auctionId,
    buyerId: auction.currentWinnerUserId,
    sellerId: auction.sellerId,
    finalPrice: auction.currentPrice,
    highValue,
    paymentMethod,
    status,
    },
    });
}

async confirmCod(orderId: bigint, buyerId: bigint) {
  const order = await this.prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new BadRequestException('Order not found');
  if (order.buyerId != buyerId) throw new BadRequestException('Not allowed');
  if (order.paymentMethod !== 'COD') throw new BadRequestException('Not a COD order');

  return this.prisma.order.update({ where: { id: orderId }, data: { status: 'FULFILLMENT' } });
}
}