import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userShopFollow } from "./userShopFollow.service";

const createUserShopFollow = catchAsync(async (req, res) => {
  const { message, result } = await userShopFollow.createShopFollowUser(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message,
    data: result,
  });
});
const getAllMyFollowingShop = catchAsync(async (req, res) => {
  const result = await userShopFollow.getAllMyFollowingShop(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Followed shops are retrieved successfully",
    data: result,
  });
});
const getSingleMyFollowingShop = catchAsync(async (req, res) => {
  const { shopId } = req.params;
  const result = await userShopFollow.getSingleMyFollowingShop(
    req.user,
    shopId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Followed shops is retrieved successfully",
    data: result,
  });
});

export const userShopFollowController = {
  createUserShopFollow,
  getAllMyFollowingShop,
  getSingleMyFollowingShop,
};
