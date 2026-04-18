import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/orders')
export class OrdersController {
    constructor(private orders: OrdersService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('id/confirm-cod')
    confirmCod(@Param('id') id: string, @Req() req: any) {
    return this.orders.confirmCod(BigInt(id), BigInt(req.user.id));
    }
}