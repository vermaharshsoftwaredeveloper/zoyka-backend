-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_outletId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "artisanId" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "specialFeatures" TEXT,
ALTER COLUMN "outletId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
