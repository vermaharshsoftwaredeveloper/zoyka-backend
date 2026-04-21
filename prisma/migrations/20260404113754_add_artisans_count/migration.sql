/*
  Warnings:

  - A unique constraint covering the columns `[name,district]` on the table `Region` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `district` to the `Region` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Region` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Region_departmentId_idx";

-- DropIndex
DROP INDEX "Region_isActive_idx";

-- DropIndex
DROP INDEX "Region_managerId_idx";

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "artisansCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_district_key" ON "Region"("name", "district");
