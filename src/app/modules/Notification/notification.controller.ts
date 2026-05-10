import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { notificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const result = await notificationService.getMyNotifications(req.user, {
    limit,
    cursor,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved",
    data: result,
  });
});

const markRead = catchAsync(async (req, res) => {
  await notificationService.markRead(req.user, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked read",
    data: null,
  });
});

const markAllRead = catchAsync(async (req, res) => {
  await notificationService.markAllRead(req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked read",
    data: null,
  });
});

export const notificationController = {
  getMyNotifications,
  markRead,
  markAllRead,
};
