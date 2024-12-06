/*
  Warnings:

  - Made the column `comment` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isReviewed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "rating" DROP DEFAULT,
ALTER COLUMN "comment" SET NOT NULL;
