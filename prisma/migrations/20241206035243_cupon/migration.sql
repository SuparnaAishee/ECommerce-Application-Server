/*
  Warnings:

  - Added the required column `discountType` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiryDate` to the `Coupon` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "DiscountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "discountType" "DiscountType" NOT NULL,
ADD COLUMN     "expiryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "minimumOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "status" "DiscountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "usageLimit" INTEGER;
