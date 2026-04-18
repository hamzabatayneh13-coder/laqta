import { Body, Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ApproveAuctionDto, RejectAuctionDto, RequestChangesAuctionDto } from './dto/auction-review.dto';
import { UpdateAuctionEndTimeDto } from './dto/update-auction-time.dto';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'), AdminGuard) // ✅ both guards on all routes
export class AdminController {
  constructor(private admin: AdminService) {}

  // ── Overview ──────────────────────────────
  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  // ── Users ─────────────────────────────────
  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  // ── KYC ───────────────────────────────────
  @Get('kyc')
  listKyc() {
    return this.admin.listPendingKyc();
  }

  @Post('kyc/:id/approve')
  approve(@Param('id') id: string) {
    return this.admin.approveKyc(id);
  }

  @Post('kyc/:id/reject')
  reject(@Param('id') id: string) {
    return this.admin.rejectKyc(id);
  }

  // ── Auctions ──────────────────────────────
  @Get('auctions')
  auctions(@Query('status') status?: string) {
    return this.admin.listAllAuctions(status);
  }

  @Get('auctions/:id')
  auction(@Param('id') id: string) {
    return this.admin.getAuction(BigInt(id));
  }

  @Post('auctions/:id/approve')
  approveAuction(@Param('id') id: string, @Req() req: any, @Body() body: ApproveAuctionDto) {
    return this.admin.approveAuction(
      BigInt(id),
      BigInt(req.user.sub),
      body.bidStep,
      body.reason,
    );
  }

  @Post('auctions/:id/request-changes')
  requestChangesAuction(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: RequestChangesAuctionDto,
  ) {
    return this.admin.requestChangesAuction(
      BigInt(id),
      BigInt(req.user.sub),
      body.reason,
      body.newDescription,
    );
  }

  @Post('auctions/:id/reject')
  rejectAuction(@Param('id') id: string, @Req() req: any, @Body() body: RejectAuctionDto) {
    return this.admin.rejectAuction(BigInt(id), BigInt(req.user.sub), body.reason);
  }

  @Post('auctions/:id/pause')
  pauseAuction(@Param('id') id: string, @Req() req: any) {
    return this.admin.pauseAuction(BigInt(id), BigInt(req.user.sub));
  }

  @Post('auctions/:id/resume')
  resumeAuction(@Param('id') id: string, @Req() req: any) {
    return this.admin.resumeAuction(BigInt(id), BigInt(req.user.sub));
  }

  // ✅ UPDATED: accept optional reason (matches your frontend)
  @Post('auctions/:id/close')
  closeAuction(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body?: { reason?: string },
  ) {
    return this.admin.closeAuction(BigInt(id), BigInt(req.user.sub), body?.reason);
  }
}
