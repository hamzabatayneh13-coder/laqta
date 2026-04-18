import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:552003@localhost:5432/laqta?schema=public";

const pool = new Pool({
  connectionString,
  options: "-c client_encoding=UTF8",
});
const adapter = new PrismaPg(pool);

// ✅ REQUIRED in your Prisma mode
const prisma = new PrismaClient({ adapter });


async function main() {
  // Categories
  const vehicles = await prisma.category.upsert({
    where: { slug: "vehicles" },
    update: {},
    create: { slug: "vehicles", nameEn: "Vehicles", nameAr: "مركبات" },
  });

  const industrial = await prisma.category.upsert({
    where: { slug: "industrial" },
    update: {},
    create: { slug: "industrial", nameEn: "Industrial", nameAr: "صناعي" },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { slug: "electronics", nameEn: "Electronics", nameAr: "إلكترونيات" },
  });

  // Seller user
  const seller = await prisma.user.upsert({
    where: { email: "seller@laqta.local" },
    update: {},
    create: {
      fullName: "Demo Seller",
      email: "seller@laqta.local",
      passwordHash: "dev", // (demo only)
      role: "SELLER",
      sellerProfile: { create: { allowsCod: true, kycStatus: "APPROVED" } },
    },
  });

  // Listings
  const listing1 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: industrial.id,
      title: "Steel Scrap Lot — 5 Tons",
      description: "Bulk lot. Pickup available in Zarqa.",
      location: "Zarqa",
      status: "APPROVED",
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: vehicles.id,
      title: "Toyota Hilux 2018 (Verified Seller)",
      description: "Well maintained. Inspection available.",
      location: "Amman",
      status: "APPROVED",
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: electronics.id,
      title: "Apple MacBook Pro 16” (M1) — Auction",
      description: "Includes charger. Condition: very good.",
      location: "Irbid",
      status: "APPROVED",
    },
  });

  // Live auctions (ends in the future)
  const now = new Date();
  const in45 = new Date(now.getTime() + 45 * 60 * 1000);
  const in90 = new Date(now.getTime() + 90 * 60 * 1000);
  const in180 = new Date(now.getTime() + 180 * 60 * 1000);

  await prisma.auction.create({
    data: {
      listingId: listing1.id,
      sellerId: seller.id,
      status: "LIVE",
      startsAt: new Date(now.getTime() - 10 * 60 * 1000),
      endsAt: in90,
      bidStep: 5,
      currentPrice: 250,
      antiSnipingEnabled: true,
      antiSnipingLastSeconds: 60,
      antiSnipingExtendSeconds: 120,
    },
  });

  await prisma.auction.create({
    data: {
      listingId: listing2.id,
      sellerId: seller.id,
      status: "LIVE",
      startsAt: new Date(now.getTime() - 5 * 60 * 1000),
      endsAt: in45,
      bidStep: 50,
      currentPrice: 8200,
      antiSnipingEnabled: true,
      antiSnipingLastSeconds: 60,
      antiSnipingExtendSeconds: 120,
    },
  });

  await prisma.auction.create({
    data: {
      listingId: listing3.id,
      sellerId: seller.id,
      status: "LIVE",
      startsAt: new Date(now.getTime() - 2 * 60 * 1000),
      endsAt: in180,
      bidStep: 10,
      currentPrice: 540,
      antiSnipingEnabled: true,
      antiSnipingLastSeconds: 60,
      antiSnipingExtendSeconds: 120,
    },
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
