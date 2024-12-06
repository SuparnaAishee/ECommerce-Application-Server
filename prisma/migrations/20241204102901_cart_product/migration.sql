/*
  Warnings:

  - You are about to drop the column `cartId` on the `CartProduct` table. All the data in the column will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId]` on the table `CartProduct` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `CartProduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartProduct" DROP CONSTRAINT "CartProduct_cartId_fkey";

-- AlterTable
ALTER TABLE "CartProduct" DROP COLUMN "cartId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Cart";

-- CreateIndex
CREATE UNIQUE INDEX "CartProduct_productId_key" ON "CartProduct"("productId");

-- AddForeignKey
ALTER TABLE "CartProduct" ADD CONSTRAINT "CartProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
