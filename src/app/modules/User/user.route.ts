import { Router } from "express";
import { userController } from "./user.controller";
import validateRequest from "../../../utils/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";

const router = Router();

router.get("/", auth(Role.ADMIN), userController.getAllUser);

router.patch(
  "/update/:userId",
  auth(Role.ADMIN),
  validateRequest(userValidation.updateUserRoleStatus),
  userController.updateUserRoleStatus
);

export const userRoutes = router;
