import { Comparison } from "@prisma/client";
import { IUser } from "../User/user.interface";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";

const createComparison = async (
  user: IUser,
  payload: Comparison & { type?: "replaceProduct" }
) => {
  const { type, ...restPayload } = payload;
  const userData = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const product = await prisma.product.findUnique({
    where: {
      id: payload.productId,
    },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const isThreeProductAdded = await prisma.comparison.findMany({
    where: {
      userId: userData?.id,
    },
  });

  if (isThreeProductAdded && isThreeProductAdded?.length === 3) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only Compare up to three products at a time"
    );
  }

  const isComparisonProductExist = await prisma.comparison.findUnique({
    where: {
      userId_productId: {
        userId: userData?.id,
        productId: product?.id,
      },
    },
  });

  if (isComparisonProductExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "This product is already exist in your selected comparison"
    );
  }

  restPayload.userId = userData?.id;

  const result = await prisma.$transaction(async (tx) => {
    if (type && type === "replaceProduct") {
      await tx.comparison.deleteMany({
        where: {
          userId: userData?.id,
        },
      });
    }
    const result = await tx.comparison.create({
      data: restPayload,
    });

    return result;
  });

  return result;
};

const getMyComparisonProduct = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.comparison.findMany({
    where: {
      userId: userData?.id,
    },
    include: {
      product: true,
      user: true,
    },
  });

  return result;
};

const deleteComparison = async (id: string) => {
  await prisma.comparison.delete({
    where: {
      id,
    },
  });
};

export const comparisonService = {
  createComparison,
  getMyComparisonProduct,
  deleteComparison,
};
