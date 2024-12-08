/*
  Warnings:

  - You are about to drop the column `isFlashSale` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `FlashSale` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FlashSale" DROP CONSTRAINT "FlashSale_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isFlashSale",
ADD COLUMN     "discount_percentage" INTEGER,
ADD COLUMN     "sale_end_time" TIMESTAMP(3),
ADD COLUMN     "sale_start_time" TIMESTAMP(3);

-- DropTable
DROP TABLE "FlashSale";
