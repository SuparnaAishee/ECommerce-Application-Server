import { IUser } from "../User/user.interface";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";

const addToWishlist = async (user: IUser, productId: string) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const isProductInWishlist = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId: userData.id, productId },
    },
  });
  if (isProductInWishlist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Product already in wishlist");
  }

  const wishlistItem = await prisma.wishlist.create({
    data: { userId: userData.id, productId },
  });

  return wishlistItem;
};

const getWishlistByUser = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: userData.id },
    include: { product: true },
  });

  return wishlist;
};

const removeFromWishlist = async (user: IUser, productId: string) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const wishlistItem = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId: userData.id, productId },
    },
  });
  if (!wishlistItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not in wishlist");
  }

  await prisma.wishlist.delete({
    where: { id: wishlistItem.id },
  });
};

export const wishlistService = {
  addToWishlist,
  getWishlistByUser,
  removeFromWishlist,
};
