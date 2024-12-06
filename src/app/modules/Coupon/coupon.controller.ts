import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { couponService } from "./coupon.service";

const createCoupon = catchAsync(async (req, res) => {
  const result = await couponService.createCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon is created successfully",
    data: result,
  });
});
const getAllCoupon = catchAsync(async (req, res) => {
  const result = await couponService.getAllCoupon();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon are retrieved successfully",
    data: result,
  });
});
const deleteCoupon = catchAsync(async (req, res) => {
  const { couponId } = req.params;
  const result = await couponService.deleteCoupon(couponId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon is deleted successfully",
    data: result,
  });
});

export const couponController = {
  createCoupon,
  getAllCoupon,
  deleteCoupon,
};
