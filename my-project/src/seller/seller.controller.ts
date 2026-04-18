import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SellerService } from './seller.service';

import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { CreateAuctionRequestDto } from './dto/create-auction-request.dto';

function fileName(req: any, file: any, cb: any) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, `${unique}${extname(file.originalname)}`);
}

function imageFileFilter(req: any, file: any, cb: any) {
  if (!file.mimetype?.startsWith('image/')) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
}

@Controller('api/seller')
export class SellerController {
  constructor(private seller: SellerService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('onboarding')
  apply(@Body() body: any, @Req() req: any) {
    return this.seller.apply(req.user.sub, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.seller.getMyProfile(req.user.sub);
  }

  // ✅ NEW: upload auction photos (multipart/form-data)
  @UseGuards(AuthGuard('jwt'))
  @Post('auctions/photos')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: fileName,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB each
    }),
  )
  uploadAuctionPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files uploaded');

    const photoPaths = files.map((f) => `/uploads/${f.filename}`);
    return { photoPaths };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('auctions')
  listMyAuctions(@Req() req: any) {
    return this.seller.listMyAuctions(req.user.sub);
  }


  // ✅ NEW: create auction request (pending admin review)
  @UseGuards(AuthGuard('jwt'))
  @Post('auctions')
  createAuctionRequest(@Body() dto: CreateAuctionRequestDto, @Req() req: any) {
    return this.seller.createAuctionRequest(req.user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('auctions/:id/resubmit')
  resubmitAuction(@Param('id') id: string, @Req() req: any) {
    return this.seller.resubmitAuction(req.user.sub, id);
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('auctions/:id')
  getMyAuction(@Param('id') id: string, @Req() req: any) {
    return this.seller.getMyAuction(req.user.sub, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('auctions/:id')
  updateMyAuction(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.seller.updateMyAuction(req.user.sub, id, body);
  }

  // ✅ Immediate delete photo
  @UseGuards(AuthGuard('jwt'))
  @Delete('auctions/:auctionId/media/:mediaId')
  deleteAuctionMedia(
    @Param('auctionId') auctionId: string,
    @Param('mediaId') mediaId: string,
    @Req() req: any,
  ) {
    return this.seller.deleteAuctionMedia(req.user.sub, auctionId, mediaId);
  }

}
