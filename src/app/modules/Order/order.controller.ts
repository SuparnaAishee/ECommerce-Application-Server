import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { orderService } from "./order.service";
import { pick } from "../../../utils/pick";

const createOrder = catchAsync(async (req, res) => {
  const result = await orderService.createOrder(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is created successfully",
    data: result,
  });
});
const getMyOrders = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await orderService.getMyOrders(req.user, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order are retrieved successfully",
    data,
    meta,
  });
});
const getShopOrder = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { shopId } = req.params;
  const { data, meta } = await orderService.geShopOrders(shopId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order are retrieved successfully",
    data,
    meta,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await orderService.getAllOrders(req.user, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order are retrieved successfully",
    data,
    meta,
  });
});
const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.updateOrderStatus(orderId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is updated successfully",
    data: result,
  });
});
const deleteMyOrder = catchAsync(async (req, res) => {
  const result = await orderService.deleteMyOrders(req.params?.orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is deleted successfully",
    data: result,
  });
});

export const orderController = {
  createOrder,
  getMyOrders,
  deleteMyOrder,
  getAllOrders,
  updateOrderStatus,
  getShopOrder,
};
