import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { profileService } from "./profile.service";

const updateProfile = catchAsync(async (req, res) => {
  const result = await profileService.updateProfile(
    req.user,
    req.file as Express.Multer.File,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});
const getMyProfile = catchAsync(async (req, res) => {
  const result = await profileService.getMyProfile(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

export const profileController = {
  updateProfile,
  getMyProfile,
};
