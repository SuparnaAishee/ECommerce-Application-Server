import httpStatus from "http-status";
import { authService } from "./auth.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

const createUser = catchAsync(async (req, res) => {
  const { password, user } = req.body;
  const { accessToken, refreshToken } = await authService.createUser(
    req.file as Express.Multer.File,
    user,
    password
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const loginUser = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body);
  const { accessToken, refreshToken } = result;
  res.cookie("refreshToken", refreshToken, {
    secure: false,
    httpOnly: true,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await authService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token generated successfully",
    data: result,
  });
});
const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await authService.changePassword(user, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Updated Successfully!",
    data: result,
  });
});
const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Please check your email to reset password",
    data: result,
  });
});
const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const result = await authService.resetPassword(token as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: result,
  });
});

export const authController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  createUser,
};
