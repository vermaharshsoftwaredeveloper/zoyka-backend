/*
  Warnings:

  - You are about to drop the column `district` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `producerName` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `producerStory` on the `Product` table. All the data in the column will be lost.
  - Added the required column `actualPrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellingPrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_district_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "district",
DROP COLUMN "price",
DROP COLUMN "producerName",
DROP COLUMN "producerStory",
ADD COLUMN     "actualPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION NOT NULL;
