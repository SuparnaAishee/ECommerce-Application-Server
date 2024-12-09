import prisma from "../../helpers/prisma";

const getAllFlashSale = async () => {
  const now = new Date().toISOString();

  return await prisma.product.findMany({
    where: {
      isFlashSale: true,
      discount_percentage: {
        not: null,
      },
      sale_start_time: {
        lte: now,
      },
      sale_end_time: {
        gt: now,
      },
    },
    include: {
      cart: true,
      category: true,
      order: true,
      reviews: true,
      shop: true,
    },
  });
};

export const flashSaleService = {
  getAllFlashSale,
};
