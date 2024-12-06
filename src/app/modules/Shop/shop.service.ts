import { Shop, UserStatus } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { fileUploader } from "../../../utils/fileUploader";
import { IUser } from "../User/user.interface";
import { IUpdateShopStatus } from "./shop.interface";

const createShop = async (
  user: IUser,
  file: Express.Multer.File,
  payload: Shop
) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user?.email,
      isDeleted: false,
      status: UserStatus.ACTIVE,
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
  if (shop) {
    throw new AppError(httpStatus.BAD_REQUEST, "Already you have a shop");
  }
  payload.userId = userData?.id;

  if (file) {
    const { secure_url } = await fileUploader.uploadToCloudinary(file);
    payload.shopLogo = secure_url;
  }

  const result = await prisma.shop.create({
    data: payload,
  });
  return result;
};

const getAllShop = async () => {
  return await prisma.shop.findMany({ include: { user: true } });
};

const getMyShop = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  const shop = await prisma.shop.findUnique({
    where: {
      userId: userData?.id,
    },
    include: {
      orders: {
        include: {
          product: true,
        },
      },
      products: true,
      follower: true,
      user: true,
    },
  });

  console.log({ shop });
  if (shop?.status === "BLOCKED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your shop is been blocked by admin"
    );
  }

  return shop;
};

const getSingleShop = async (id: string) => {
  const shop = await prisma.shop.findUnique({
    where: {
      id,
    },
    include: {
      products: true,
      follower: true,
      user: true,
    },
  });

  return shop;
};

const updateMyShop = async (
  user: IUser,
  file: Express.Multer.File,
  payload: Partial<Shop>
) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user.email,
      isDeleted: false,
      status: UserStatus.ACTIVE,
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
    throw new AppError(httpStatus.BAD_REQUEST, "Shop is not found");
  }
  if (shop?.status === "BLOCKED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your shop is been blocked by admin"
    );
  }

  if (file) {
    const { secure_url } = await fileUploader.uploadToCloudinary(file);
    payload.shopLogo = secure_url;
  }

  const result = await prisma.shop.update({
    where: {
      userId: userData?.id,
    },
    data: payload,
  });
  return result;
};
const updateShopStatus = async (payload: IUpdateShopStatus) => {
  const shop = await prisma.shop.findUnique({
    where: {
      id: payload.shopId,
    },
  });
  if (!shop) {
    throw new AppError(httpStatus.BAD_REQUEST, "Shop is not found");
  }

  const result = await prisma.shop.update({
    where: {
      id: payload.shopId,
    },
    data: {
      status: payload.status,
    },
  });
  return result;
};

const deleteMyShop = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user.email,
      isDeleted: false,
      status: UserStatus.ACTIVE,
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
    throw new AppError(httpStatus.BAD_REQUEST, "Shop is not found");
  }

  const result = await prisma.shop.delete({
    where: {
      userId: userData?.id,
    },
  });
  return result;
};

export const shopService = {
  createShop,
  getAllShop,
  getMyShop,
  updateMyShop,
  deleteMyShop,
  updateShopStatus,
  getSingleShop,
};
