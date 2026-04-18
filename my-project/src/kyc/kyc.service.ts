import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KycService {
    constructor(private prisma: PrismaService) {}
    upload(userId: bigint, type: string, filePath: string) {
    return this.prisma.kycDocument.create({ data: { userId, type, filePath, status: 'PENDING' } });
    }
}