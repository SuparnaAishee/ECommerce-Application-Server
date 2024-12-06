import { Coupon } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";

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
const getAllCoupon = async () => {
  const coupon = await prisma.coupon.findMany();
  return coupon;
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
};
