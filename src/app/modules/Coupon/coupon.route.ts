import { Router } from "express";
import { couponController } from "./coupon.controller";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { couponValidation } from "./coupon.validation";
import validateRequest from "../../../utils/validateRequest";

const router = Router();

router.post(
  "/create-coupon",
  auth(Role.ADMIN),
  validateRequest(couponValidation.createCoupon),
  couponController.createCoupon
);
router.post(
  "/validate-coupon",
  auth(Role.USER),
  validateRequest(couponValidation.validateCoupon),
  couponController.validateCoupon
);

router.get("/", auth(Role.ADMIN), couponController.getAllCoupon);
router.delete("/:couponId", auth(Role.ADMIN), couponController.deleteCoupon);

export const couponRoutes = router;
