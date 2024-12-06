-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "shop" ADD COLUMN     "status" "ShopStatus" NOT NULL DEFAULT 'ACTIVE';
