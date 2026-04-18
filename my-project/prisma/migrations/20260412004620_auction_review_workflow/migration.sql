-- CreateEnum (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminDecision') THEN
    CREATE TYPE "AdminDecision" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES');
  END IF;
END
$$;

-- AlterEnum (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuctionStatus' AND e.enumlabel = 'NEEDS_CHANGES'
  ) THEN
    ALTER TYPE "AuctionStatus" ADD VALUE 'NEEDS_CHANGES';
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuctionReview" (
  "id" BIGSERIAL NOT NULL,
  "auctionId" BIGINT NOT NULL,
  "adminId" BIGINT NOT NULL,
  "decision" "AdminDecision" NOT NULL,
  "reason" TEXT,
  "newDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuctionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'AuctionReview_auctionId_createdAt_idx'
  ) THEN
    CREATE INDEX "AuctionReview_auctionId_createdAt_idx"
      ON "AuctionReview"("auctionId", "createdAt" DESC);
  END IF;
END
$$;

-- AddForeignKey (safe-ish)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AuctionReview_auctionId_fkey'
  ) THEN
    ALTER TABLE "AuctionReview"
      ADD CONSTRAINT "AuctionReview_auctionId_fkey"
      FOREIGN KEY ("auctionId") REFERENCES "Auction"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
