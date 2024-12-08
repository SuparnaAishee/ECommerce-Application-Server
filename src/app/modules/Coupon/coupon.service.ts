import { Coupon } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";

const createCoupon = async (payload: Coupon) => {
  const coupon = await prisma.coupon.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (coupon) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already a coupon code in this name"
    );
  }

  const result = await prisma.coupon.create({
    data: payload,
  });

  return result;
};
const validateCoupon = async (payload: {
  totalAmount: number;
  code: string;
}) => {
  const coupon = await prisma.coupon.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, "Coupon code is not found");
  }
  if (coupon?.status === "INACTIVE") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This coupon is now ${coupon?.status}`
    );
  }

  if (payload?.totalAmount < coupon?.minimumOrderValue) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum order amount is ${coupon?.minimumOrderValue}`
    );
  }
  if (coupon?.usageLimit === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, `Coupon usage limit is finish`);
  }

  const [day, month, year] = coupon?.expiryDate.split("-").map(Number);
  const formattedDate = new Date(year, month - 1, day);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  if (formattedDate < currentDate) {
    throw new AppError(httpStatus.BAD_REQUEST, `Coupon Date is expired`);
  }

  return coupon;
};
const getAllCoupon = async (options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const result = await prisma.coupon.findMany({
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });
  const total = await prisma.coupon.count();

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};
const deleteCoupon = async (id: string) => {
  const coupon = await prisma.coupon.delete({
    where: {
      id,
    },
  });
  return coupon;
};

export const couponService = {
  createCoupon,
  getAllCoupon,
  deleteCoupon,
  validateCoupon,
};
