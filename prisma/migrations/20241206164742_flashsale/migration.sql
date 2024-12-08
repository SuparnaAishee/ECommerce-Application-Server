-- CreateTable
CREATE TABLE "FlashSale" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "discount_percentage" INTEGER NOT NULL,
    "sale_start_time" TIMESTAMP(3) NOT NULL,
    "sale_end_time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlashSale_productId_key" ON "FlashSale"("productId");

-- AddForeignKey
ALTER TABLE "FlashSale" ADD CONSTRAINT "FlashSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
