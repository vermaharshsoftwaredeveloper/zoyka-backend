-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "address" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "monthlyCapacity" INTEGER,
ADD COLUMN     "qualityScore" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "title" TEXT,
    "unitCount" INTEGER NOT NULL,
    "qualityStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionBatch_outletId_idx" ON "ProductionBatch"("outletId");

-- CreateIndex
CREATE INDEX "Payout_outletId_idx" ON "Payout"("outletId");

-- CreateIndex
CREATE INDEX "Outlet_categoryId_idx" ON "Outlet"("categoryId");

-- CreateIndex
CREATE INDEX "Region_categoryId_idx" ON "Region"("categoryId");

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatch" ADD CONSTRAINT "ProductionBatch_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
