import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userService } from "./user.service";

const updateUserRoleStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await userService.updateUserRoleStatus(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});
const getAllUser = catchAsync(async (req, res) => {
  const result = await userService.getAllUser(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users are retrieved successfully",
    data: result,
  });
});

export const userController = {
  updateUserRoleStatus,
  getAllUser,
};
