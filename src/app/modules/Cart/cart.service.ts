import { Cart } from "@prisma/client";
import { IUser } from "../User/user.interface";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { IUpdateCartProduct } from "./cart.interface";

const addToCart = async (
  user: IUser,
  payload: Cart & { type?: "replaceProduct" }
) => {
  const { type, ...restPayload } = payload;
  const userData = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "user is not found");
  }

  const product = await prisma.product.findUnique({
    where: {
      id: payload.productId,
    },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product is not found");
  }

  if (product.inventory === 0 || product.inventory < payload.quantity) {
    throw new AppError(httpStatus.NOT_FOUND, "insufficient  product quantity");
  }

  const isAddedToCart = await prisma.cart.findUnique({
    where: {
      productId: payload?.productId,
    },
  });
  if (isAddedToCart) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This product is already in your cart"
    );
  }

  restPayload.userId = userData.id;

  const result = await prisma.$transaction(async (tx) => {
    console.log(type);
    if (payload?.type && payload?.type === "replaceProduct") {
      await tx.cart.deleteMany({
        where: {
          userId: user?.id,
        },
      });
    }

    const cartData = await tx.cart.create({
      data: restPayload,
      include: {
        product: {
          include: {
            shop: true,
          },
        },
      },
    });

    return cartData;
  });

  return result;
};

const getMyCartProduct = async (user: IUser) => {
  const cartProduct = await prisma.cart.findMany({
    where: {
      userId: user?.id,
    },
    include: {
      product: true,
      user: true,
    },
  });

  return cartProduct;
};

const deleteMyCartProduct = async (user: IUser, id: string) => {
  const cartProduct = await prisma.cart.findUnique({
    where: {
      userId: user?.id,
      id,
    },
  });

  if (!cartProduct) {
    throw new AppError(httpStatus.NOT_FOUND, "Cart product is not found!");
  }

  const result = await prisma.cart.delete({
    where: {
      userId: user?.id,
      id,
    },
  });

  return result;
};

const updateCartProductQuantity = async (
  user: IUser,
  payload: IUpdateCartProduct
) => {
  const cartProduct = await prisma.cart.findUnique({
    where: {
      userId: user?.id,
      id: payload.productId,
    },
  });

  if (!cartProduct) {
    throw new AppError(httpStatus.NOT_FOUND, "Cart product is not found!");
  }

  const result = await prisma.cart.update({
    where: {
      userId: user?.id,
      id: payload.productId,
    },
    data: {
      quantity: {
        [payload.type]: payload.quantity,
      },
    },
  });

  return result;
};

export const cartService = {
  addToCart,
  getMyCartProduct,
  deleteMyCartProduct,
  updateCartProductQuantity,
};
