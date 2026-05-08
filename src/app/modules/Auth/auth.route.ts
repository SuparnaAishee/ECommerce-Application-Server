import { Router } from "express";
import { authController } from "./auth.controller";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { fileUploader } from "../../../utils/fileUploader";
import parseRequest from "../../../utils/parseRequest";
import validateRequest from "../../../utils/validateRequest";
import { authLimiter, passwordResetLimiter } from "../../../utils/rateLimit";
import { userValidation } from "../User/user.validation";

const router = Router();
router.post(
  "/register",
  authLimiter,
  fileUploader.upload.single("file"),
  parseRequest,
  validateRequest(userValidation.createUser),
  authController.createUser
);

router.post("/login", authLimiter, authController.loginUser);
router.post("/refreshToken", authController.refreshToken);
router.post(
  "/change-password",
  auth(Role.ADMIN, Role.VENDOR, Role.USER),
  authController.changePassword
);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);

export const authRoutes = router;
