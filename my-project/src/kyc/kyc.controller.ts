import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { KycService } from './kyc.service';

@Controller('api/kyc')
export class KycController {
    constructor(private kyc: KycService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: process.env.UPLOAD_DIR || '/uploads',
            filename: (req, file, cb) => cb(null, `${Date.now()}${file.originalname}`),
        }),
    }))
    upload(@UploadedFile() file: Express.Multer.File, @Body('type') type: string, @Req() req: any) {
        return this.kyc.upload(BigInt(req.user.userId), type, file.path);
    }
}