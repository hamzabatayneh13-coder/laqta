import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

type CategorySeed = {
  slug: string;
  nameEn: string;
  nameAr: string;
  defaultMinBid: number;
  parentSlug?: string;
};

const CATEGORIES: CategorySeed[] = [
  // 1) Vehicles
  { slug: 'vehicles', nameEn: 'Vehicles', nameAr: 'مركبات', defaultMinBid: 50 },
  { slug: 'cars', nameEn: 'Cars', nameAr: 'سيارات', defaultMinBid: 50, parentSlug: 'vehicles' },
  { slug: 'motorcycles', nameEn: 'Motorcycles', nameAr: 'دراجات نارية', defaultMinBid: 25, parentSlug: 'vehicles' },
  { slug: 'trucks-pickups', nameEn: 'Trucks & Pickups', nameAr: 'شاحنات وبيك اب', defaultMinBid: 75, parentSlug: 'vehicles' },
  { slug: 'vans-buses', nameEn: 'Vans & Buses', nameAr: 'فانات وباصات', defaultMinBid: 75, parentSlug: 'vehicles' },
  { slug: 'vehicle-parts', nameEn: 'Spare Parts & Accessories', nameAr: 'قطع غيار وإكسسوارات', defaultMinBid: 10, parentSlug: 'vehicles' },
  { slug: 'salvage', nameEn: 'Salvage / Accident Vehicles', nameAr: 'مركبات متضررة', defaultMinBid: 25, parentSlug: 'vehicles' },

  // 2) Electronics
  { slug: 'electronics', nameEn: 'Electronics', nameAr: 'إلكترونيات', defaultMinBid: 10 },
  { slug: 'phones-tablets', nameEn: 'Phones & Tablets', nameAr: 'هواتف وأجهزة لوحية', defaultMinBid: 10, parentSlug: 'electronics' },
  { slug: 'laptops-pcs', nameEn: 'Laptops & PCs', nameAr: 'لابتوبات وكمبيوتر', defaultMinBid: 10, parentSlug: 'electronics' },
  { slug: 'gaming', nameEn: 'Gaming Consoles', nameAr: 'أجهزة ألعاب', defaultMinBid: 10, parentSlug: 'electronics' },
  { slug: 'tv-audio', nameEn: 'TV & Audio', nameAr: 'تلفزيونات وصوتيات', defaultMinBid: 10, parentSlug: 'electronics' },
  { slug: 'cameras', nameEn: 'Cameras', nameAr: 'كاميرات', defaultMinBid: 10, parentSlug: 'electronics' },
  { slug: 'appliances', nameEn: 'Home Appliances', nameAr: 'أجهزة منزلية', defaultMinBid: 10, parentSlug: 'electronics' },

  // 3) Real Estate
  { slug: 'real-estate', nameEn: 'Real Estate', nameAr: 'عقارات', defaultMinBid: 250 },
  { slug: 'land', nameEn: 'Land', nameAr: 'أراضي', defaultMinBid: 250, parentSlug: 'real-estate' },
  { slug: 'apartments', nameEn: 'Apartments', nameAr: 'شقق', defaultMinBid: 250, parentSlug: 'real-estate' },
  { slug: 'villas', nameEn: 'Villas', nameAr: 'فلل', defaultMinBid: 250, parentSlug: 'real-estate' },
  { slug: 'commercial', nameEn: 'Commercial', nameAr: 'تجاري', defaultMinBid: 250, parentSlug: 'real-estate' },
  { slug: 'warehouses', nameEn: 'Warehouses', nameAr: 'مستودعات', defaultMinBid: 250, parentSlug: 'real-estate' },
  { slug: 'farms', nameEn: 'Farms', nameAr: 'مزارع', defaultMinBid: 250, parentSlug: 'real-estate' },

  // 4) Home & Furniture
  { slug: 'home-furniture', nameEn: 'Home & Furniture', nameAr: 'المنزل والأثاث', defaultMinBid: 5 },
  { slug: 'living-room', nameEn: 'Living Room', nameAr: 'غرفة معيشة', defaultMinBid: 5, parentSlug: 'home-furniture' },
  { slug: 'bedroom', nameEn: 'Bedroom', nameAr: 'غرفة نوم', defaultMinBid: 5, parentSlug: 'home-furniture' },
  { slug: 'dining', nameEn: 'Dining', nameAr: 'سفرة', defaultMinBid: 5, parentSlug: 'home-furniture' },
  { slug: 'office-furniture', nameEn: 'Office Furniture', nameAr: 'أثاث مكتبي', defaultMinBid: 5, parentSlug: 'home-furniture' },
  { slug: 'kitchen', nameEn: 'Kitchen', nameAr: 'مطبخ', defaultMinBid: 5, parentSlug: 'home-furniture' },
  { slug: 'decor', nameEn: 'Home Decor', nameAr: 'ديكور منزلي', defaultMinBid: 5, parentSlug: 'home-furniture' },

  // 5) Machinery & Equipment
  { slug: 'machinery', nameEn: 'Machinery & Equipment', nameAr: 'معدات وآليات', defaultMinBid: 25 },
  { slug: 'construction-equipment', nameEn: 'Construction Equipment', nameAr: 'معدات إنشاء', defaultMinBid: 25, parentSlug: 'machinery' },
  { slug: 'industrial-machines', nameEn: 'Industrial Machines', nameAr: 'آلات صناعية', defaultMinBid: 25, parentSlug: 'machinery' },
  { slug: 'generators', nameEn: 'Generators', nameAr: 'مولدات', defaultMinBid: 25, parentSlug: 'machinery' },
  { slug: 'tools', nameEn: 'Tools', nameAr: 'أدوات', defaultMinBid: 10, parentSlug: 'machinery' },
  { slug: 'farming-equipment', nameEn: 'Farming Equipment', nameAr: 'معدات زراعية', defaultMinBid: 25, parentSlug: 'machinery' },

  // 6) Scrap & Metals
  { slug: 'scrap-metals', nameEn: 'Scrap & Metals', nameAr: 'سكراب ومعادن', defaultMinBid: 5 },
  { slug: 'copper', nameEn: 'Copper', nameAr: 'نحاس', defaultMinBid: 5, parentSlug: 'scrap-metals' },
  { slug: 'aluminum', nameEn: 'Aluminum', nameAr: 'ألمنيوم', defaultMinBid: 5, parentSlug: 'scrap-metals' },
  { slug: 'iron-steel', nameEn: 'Iron / Steel', nameAr: 'حديد / فولاذ', defaultMinBid: 5, parentSlug: 'scrap-metals' },
  { slug: 'mixed-scrap', nameEn: 'Mixed Scrap Lots', nameAr: 'خلطات سكراب', defaultMinBid: 5, parentSlug: 'scrap-metals' },
  { slug: 'cables-wiring', nameEn: 'Cables / Wiring', nameAr: 'كيابل وأسلاك', defaultMinBid: 5, parentSlug: 'scrap-metals' },

  // 7) Business & Inventory Liquidation
  { slug: 'liquidation', nameEn: 'Business & Inventory Liquidation', nameAr: 'تصفية مخزون وتجهيزات', defaultMinBid: 10 },
  { slug: 'store-liquidation', nameEn: 'Store Liquidation Lots', nameAr: 'تصفية محل (دفعات)', defaultMinBid: 10, parentSlug: 'liquidation' },
  { slug: 'wholesale-stock', nameEn: 'Wholesale Stock', nameAr: 'بضاعة جملة', defaultMinBid: 10, parentSlug: 'liquidation' },
  { slug: 'returns-openbox', nameEn: 'Returned / Open-box', nameAr: 'مرتجعات / مفتوح', defaultMinBid: 10, parentSlug: 'liquidation' },
  { slug: 'overstock', nameEn: 'Overstocks', nameAr: 'فائض مخزون', defaultMinBid: 10, parentSlug: 'liquidation' },

  // 8) Collectibles & Luxury
  { slug: 'collectibles-luxury', nameEn: 'Collectibles & Luxury', nameAr: 'مقتنيات وفخامة', defaultMinBid: 10 },
  { slug: 'watches', nameEn: 'Watches', nameAr: 'ساعات', defaultMinBid: 10, parentSlug: 'collectibles-luxury' },
  { slug: 'jewelry', nameEn: 'Jewelry', nameAr: 'مجوهرات', defaultMinBid: 10, parentSlug: 'collectibles-luxury' },
  { slug: 'antiques', nameEn: 'Antiques', nameAr: 'تحف', defaultMinBid: 10, parentSlug: 'collectibles-luxury' },
  { slug: 'coins', nameEn: 'Coins', nameAr: 'عملات', defaultMinBid: 10, parentSlug: 'collectibles-luxury' },
  { slug: 'art', nameEn: 'Art', nameAr: 'فن', defaultMinBid: 10, parentSlug: 'collectibles-luxury' },
];

async function main() {
  const parents = CATEGORIES.filter((c) => !c.parentSlug);
  const children = CATEGORIES.filter((c) => c.parentSlug);

  // Parents first
  for (const p of parents) {
    await prisma.category.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        defaultMinBid: new Prisma.Decimal(p.defaultMinBid),
        parentId: null,
      },
      update: {
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        defaultMinBid: new Prisma.Decimal(p.defaultMinBid),
        parentId: null,
      },
    });
  }

  // Children
  for (const ch of children) {
    const parent = await prisma.category.findUnique({
      where: { slug: ch.parentSlug! },
      select: { id: true },
    });
    if (!parent) throw new Error(`Parent not found for child "${ch.slug}": ${ch.parentSlug}`);

    await prisma.category.upsert({
      where: { slug: ch.slug },
      create: {
        slug: ch.slug,
        nameEn: ch.nameEn,
        nameAr: ch.nameAr,
        defaultMinBid: new Prisma.Decimal(ch.defaultMinBid),
        parentId: parent.id,
      },
      update: {
        nameEn: ch.nameEn,
        nameAr: ch.nameAr,
        defaultMinBid: new Prisma.Decimal(ch.defaultMinBid),
        parentId: parent.id,
      },
    });
  }

  console.log(`Seeded categories: parents=${parents.length}, children=${children.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
