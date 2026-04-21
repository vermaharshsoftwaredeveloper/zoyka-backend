-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PRODUCER';
ALTER TYPE "Role" ADD VALUE 'ARTISAN';

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Outlet_regionId_idx" ON "Outlet"("regionId");

-- CreateIndex
CREATE INDEX "Outlet_ownerId_idx" ON "Outlet"("ownerId");

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
