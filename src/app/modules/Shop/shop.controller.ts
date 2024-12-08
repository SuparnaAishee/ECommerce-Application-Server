import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { shopService } from "./shop.service";
import { pick } from "../../../utils/pick";

const createShop = catchAsync(async (req, res) => {
  const result = await shopService.createShop(
    req.user,
    req.file as Express.Multer.File,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shop is created successfully",
    data: result,
  });
});
const getAllShop = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await shopService.getAllShop(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shops are retrieved created successfully",
    data: data,
    meta,
  });
});
const getMyShop = catchAsync(async (req, res) => {
  const result = await shopService.getMyShop(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shops is retrieved successfully",
    data: result,
  });
});
const getSingleShop = catchAsync(async (req, res) => {
  const { shopId } = req.params;
  const result = await shopService.getSingleShop(shopId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shops is retrieved successfully",
    data: result,
  });
});

const updateMyShop = catchAsync(async (req, res) => {
  const result = await shopService.updateMyShop(
    req.user,
    req.file as Express.Multer.File,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shops is updated successfully",
    data: result,
  });
});
const updateShopStatus = catchAsync(async (req, res) => {
  const result = await shopService.updateShopStatus(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shops status updated successfully",
    data: result,
  });
});
const deleteMyShop = catchAsync(async (req, res) => {
  const result = await shopService.deleteMyShop(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shops is deleted successfully",
    data: result,
  });
});

export const shopController = {
  createShop,
  getAllShop,
  getMyShop,
  updateMyShop,
  deleteMyShop,
  updateShopStatus,
  getSingleShop,
};
