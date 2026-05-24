-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "minBid" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "defaultMinBid" DECIMAL(65,30) NOT NULL DEFAULT 1.0;
