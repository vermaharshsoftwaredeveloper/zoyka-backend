/*
  Warnings:

  - You are about to drop the column `managerId` on the `Region` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[managerId]` on the table `Outlet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Region" DROP CONSTRAINT "Region_managerId_fkey";

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "managerId" TEXT;

-- AlterTable
ALTER TABLE "Region" DROP COLUMN "managerId";

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_managerId_key" ON "Outlet"("managerId");

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
