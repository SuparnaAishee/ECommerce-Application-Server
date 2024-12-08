import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { couponService } from "./coupon.service";
import { pick } from "../../../utils/pick";

const createCoupon = catchAsync(async (req, res) => {
  const result = await couponService.createCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon is created successfully",
    data: result,
  });
});
const validateCoupon = catchAsync(async (req, res) => {
  const result = await couponService.validateCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Discount retrieved successfully",
    data: result,
  });
});
const getAllCoupon = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await couponService.getAllCoupon(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon are retrieved successfully",
    data: data,
    meta,
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
  validateCoupon,
};
