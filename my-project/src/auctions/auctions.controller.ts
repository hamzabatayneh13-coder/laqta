import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('api/auctions')
export class AuctionsController {
  constructor(private auctions: AuctionsService) {}

  // ✅ NEW: must be ABOVE ":id"
  @Get('live')
  live() {
    return this.auctions.listLive();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Auction id is required');
    }
    return this.auctions.getAuction(BigInt(id));
  }


  @UseGuards(AuthGuard('jwt'))
  @Post(':id/bids')
  async bid(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const io = req.app.get('io');
    return this.auctions.placeBid(
      BigInt(id),
      BigInt(req.user.sub),
      Number(body.amount), // ✅ ensure numeric
      io,
    );
  }
}
