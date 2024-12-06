import { Prisma, Product } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { fileUploader } from "../../../utils/fileUploader";
import { IUser } from "../User/user.interface";
import { IProductQuery } from "./product.interface";
import { paginationHelper } from "../../helpers/paginationHelper";
import { productSearchableFields } from "./product.const";

const createProduct = async (
  user: IUser,
  files: Express.Multer.File[],
  payload: Product
) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user?.email,
    },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User is not found");
  }

  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
  });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category is not found");
  }

  const shop = await prisma.shop.findUnique({
    where: {
      userId: userData?.id,
    },
  });
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, "Shop is not found");
  }

  if (shop?.status === "BLOCKED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your shop is been blocked by admin"
    );
  }

  payload.shopId = shop.id;

  if (files?.length > 0) {
    const imageUrls = await fileUploader.uploadMultipleToCloudinary(files);
    payload.images = imageUrls;
  }

  const result = await prisma.product.create({
    data: payload,
  });

  return result;
};

const getAllProduct = async (query: IProductQuery, options: any) => {
  const { limit, skip, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, category, ...restQueries } = query;
  const andCondition: Prisma.ProductWhereInput[] = [];

  if (searchTerm == "recentViewedProduct") {
    const data = await prisma.product.findMany({
      where: {
        view: {
          gt: 0,
        },
      },
      orderBy: {
        view: "desc",
      },
      take: 10,
      include: {
        category: true,
        shop: true,
        reviews: {
          include: {
            user: true,
          },
        },
      },
    });

    const total = await prisma.product.count({
      take: 10,
    });
    return {
      meta: {
        total,
        page,
        limit,
      },
      data,
    };
  }

  if (searchTerm) {
    andCondition.push({
      OR: productSearchableFields?.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (category) {
    andCondition.push({
      category: {
        name: {
          contains: category,
        },
      },
    });
  }

  if (Object.keys(restQueries).length > 0) {
    andCondition.push({
      AND: Object.keys(restQueries).map((key) => ({
        [key]: {
          equals: (restQueries as any)[key],
        },
      })),
    });
  }

  const whereCondition: Prisma.ProductWhereInput = { AND: andCondition };
  const data = await prisma.product.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      category: true,
      shop: true,
      reviews: {
        include: {
          user: true,
        },
      },
    },
  });
  const total = await prisma.product.count({
    where: whereCondition,
  });
  return {
    meta: {
      total,
      page,
      limit,
    },
    data,
  };
};
const getMyProducts = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User is not found");
  }

  const shop = await prisma.shop.findUnique({
    where: {
      userId: userData?.id,
    },
  });

  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, "Shop is not found");
  }

  const product = await prisma.product.findMany({
    where: {
      shopId: shop.id,
    },
    include: {
      category: true,
      shop: true,
      reviews: {
        include: {
          user: true,
        },
      },
    },
  });
  return product;
};

const getSingleProduct = async (id: string) => {
  await prisma.product.update({
    where: {
      id,
    },
    data: {
      view: {
        increment: 1,
      },
    },
  });
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
      shop: true,
      reviews: {
        include: {
          user: true,
        },
      },
    },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product is not found");
  }

  return product;
};

const updateSingleProduct = async (
  id: string,
  files: Express.Multer.File[],
  payload: Partial<Product>
) => {
  const product = await prisma.product.findUnique({
    where: {
      id: id,
    },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product is not found");
  }

  const shop = await prisma.shop.findUnique({
    where: {
      id: product?.shopId,
    },
  });

  if (shop?.status === "BLOCKED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your shop is been blocked by admin"
    );
  }

  if (files?.length > 0) {
    const imageUrl = await fileUploader.uploadMultipleToCloudinary(files);
    payload.images = imageUrl;
  }

  const result = await prisma.product.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};
const deleteSingleProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: {
      id: id,
    },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product is not found");
  }

  const result = await prisma.product.delete({
    where: {
      id,
    },
  });

  return result;
};

export const productService = {
  createProduct,
  getAllProduct,
  getSingleProduct,
  updateSingleProduct,
  deleteSingleProduct,
  getMyProducts,
};
