import { User } from "@prisma/client";
import { IUser } from "../User/user.interface";
import { fileUploader } from "../../../utils/fileUploader";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";

const updateProfile = async (
  user: IUser,
  file: Express.Multer.File,
  payload: User
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

  return await prisma.user.update({
    where: {
      id: user?.id,
    },
    data: payload,
  });
};
const getMyProfile = async (user: IUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return userData;
};

export const profileService = {
  updateProfile,
  getMyProfile,
};
