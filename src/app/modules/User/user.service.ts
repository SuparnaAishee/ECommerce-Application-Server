import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { IUser, IUserRoleStatus } from "./user.interface";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";

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

const getAllUser = async (user: IUser, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.user.findMany({
    where: {
      isDeleted: false,
      email: {
        not: user.email,
      },
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });
  const total = await prisma.user.count();

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

export const userService = {
  updateUserRoleStatus,
  getAllUser,
};
