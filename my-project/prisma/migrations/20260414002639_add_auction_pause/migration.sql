-- AlterEnum
ALTER TYPE "AuctionStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "totalPausedMs" BIGINT NOT NULL DEFAULT 0;
