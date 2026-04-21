-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'FARMER';
ALTER TYPE "Role" ADD VALUE 'KITCHEN';

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ordersCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "amount" SET DEFAULT 0;
