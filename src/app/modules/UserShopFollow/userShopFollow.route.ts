import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import validateRequest from "../../../utils/validateRequest";
import { userShopFollowValidation } from "./userShopFollow.validation";
import { userShopFollowController } from "./userShopFollow.controller";

const router = Router();

router.post(
  "/",
  auth(Role.USER),
  validateRequest(userShopFollowValidation.createUserShopFollow),
  userShopFollowController.createUserShopFollow
);

router.get(
  "/",
  auth(Role.USER),
  userShopFollowController.getAllMyFollowingShop
);
router.get(
  "/:shopId",
  auth(Role.USER),
  userShopFollowController.getSingleMyFollowingShop
);

export const userShopFollowRoutes = router;
