import { Router } from "express";
import { authController } from "./auth.controller";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { fileUploader } from "../../../utils/fileUploader";
import parseRequest from "../../../utils/parseRequest";
import validateRequest from "../../../utils/validateRequest";
import { userValidation } from "../User/user.validation";

const router = Router();
router.post(
  "/register",
  fileUploader.upload.single("file"),
  parseRequest,
  validateRequest(userValidation.createUser),
  authController.createUser
);

router.post("/login", authController.loginUser);
router.post("/refreshToken", authController.refreshToken);
router.post(
  "/change-password",
  auth(Role.ADMIN, Role.VENDOR, Role.USER),
  authController.changePassword
);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export const authRoutes = router;
