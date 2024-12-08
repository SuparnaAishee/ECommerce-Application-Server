import prisma from "../../helpers/prisma";

const getAllFlashSale = async () => {
  return await prisma.product.findMany({
    where: {
      isFlashSale: true,
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
