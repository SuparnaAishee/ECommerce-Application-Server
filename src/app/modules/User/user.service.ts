import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { IUser, IUserRoleStatus } from "./user.interface";

const updateUserRoleStatus = async (id: string, payload: IUserRoleStatus) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User is not found!");
  }

  const result = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: payload,
  });

  return result;
};

const getAllUser = async (user: IUser) => {
  const result = await prisma.user.findMany({
    where: {
      isDeleted: false,
      email: {
        not: user.email,
      },
    },
  });
  return result;
};

export const userService = {
  updateUserRoleStatus,
  getAllUser,
};
