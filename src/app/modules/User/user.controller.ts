import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userService } from "./user.service";
import { pick } from "../../../utils/pick";

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
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await userService.getAllUser(req.user, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users are retrieved successfully",
    data: data,
    meta,
  });
});

export const userController = {
  updateUserRoleStatus,
  getAllUser,
};
