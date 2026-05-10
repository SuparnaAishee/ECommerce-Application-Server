import { User } from "@prisma/client";
import { IUser } from "../User/user.interface";
import { fileUploader } from "../../../utils/fileUploader";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePhoto: true,
  description: true,
  phone: true,
  address: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const updateProfile = async (
  user: IUser,
  file: Express.Multer.File,
  payload: Partial<User>,
) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  if (file) {
    const { secure_url } = await fileUploader.uploadToCloudinary(file);
    payload.profilePhoto = secure_url;
  }

  // Strip server-controlled fields a client should never overwrite
  const {
    id: _id,
    email: _email,
    role: _role,
    password: _password,
    status: _status,
    isDeleted: _isDeleted,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...safePayload
  } = payload as Record<string, unknown>;
  void _id;
  void _email;
  void _role;
  void _password;
  void _status;
  void _isDeleted;
  void _createdAt;
  void _updatedAt;

  return await prisma.user.update({
    where: {
      id: user?.id,
    },
    data: safePayload,
    select: SAFE_USER_SELECT,
  });
};

const getMyProfile = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
    select: SAFE_USER_SELECT,
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return userData;
};

const getMyStats = async (user: IUser) => {
  const [orderCount, wishlistCount, reviewedOrderCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.wishlist.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, isReviewed: true } }),
  ]);
  return {
    orders: orderCount,
    wishlist: wishlistCount,
    reviews: reviewedOrderCount,
  };
};

export const profileService = {
  updateProfile,
  getMyProfile,
  getMyStats,
};
