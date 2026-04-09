/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Region` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Region" DROP CONSTRAINT "Region_categoryId_fkey";

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "location" TEXT,
ADD COLUMN     "noOfArtisans" INTEGER;

-- AlterTable
ALTER TABLE "Region" DROP COLUMN "categoryId",
ADD COLUMN     "regionHead" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankIfscCode" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER;
