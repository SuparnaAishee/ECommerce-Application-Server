/*
  Warnings:

  - You are about to drop the `UserVendorFollow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserVendorFollow" DROP CONSTRAINT "UserVendorFollow_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserVendorFollow" DROP CONSTRAINT "UserVendorFollow_vendorId_fkey";

-- DropTable
DROP TABLE "UserVendorFollow";

-- CreateTable
CREATE TABLE "UserShopFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserShopFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserShopFollow_userId_shopId_key" ON "UserShopFollow"("userId", "shopId");

-- AddForeignKey
ALTER TABLE "UserShopFollow" ADD CONSTRAINT "UserShopFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopFollow" ADD CONSTRAINT "UserShopFollow_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
