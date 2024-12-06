import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { orderService } from "./order.service";

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
  const result = await orderService.getMyOrders(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order are retrieved successfully",
    data: result,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrders(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order are retrieved successfully",
    data: result,
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
};
