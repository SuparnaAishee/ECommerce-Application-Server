import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { profileController } from "./profile.controller";
import { fileUploader } from "../../../utils/fileUploader";
import parseRequest from "../../../utils/parseRequest";
import validateRequest from "../../../utils/validateRequest";
import { profileValidation } from "./profile.validation";

const router = Router();

router.post(
  "/update-profile",
  auth(Role.USER, Role.ADMIN, Role.VENDOR),
  fileUploader.upload.single("file"),
  parseRequest,
  validateRequest(profileValidation.updateProfile),
  profileController.updateProfile
);
router.get(
  "/my-profile",
  auth(Role.USER, Role.ADMIN, Role.VENDOR),
  profileController.getMyProfile
);

export const profileRoutes = router;
