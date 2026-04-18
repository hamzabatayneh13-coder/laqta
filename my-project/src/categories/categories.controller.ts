import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api/categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.category.findMany({
      orderBy: { nameEn: 'asc' },
      select: { id: true, slug: true, nameEn: true, nameAr: true },
    });
  }
}
