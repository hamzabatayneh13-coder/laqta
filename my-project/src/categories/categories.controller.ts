import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get('categories')
  async listCategories() {
    const cats = await this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { nameEn: 'asc' }],
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        parentId: true, // ✅ IMPORTANT
      },
    });

    return cats.map((c) => ({
      id: c.id.toString(),
      slug: c.slug,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      parentId: c.parentId ? c.parentId.toString() : null, // ✅ IMPORTANT
    }));
  }
}
