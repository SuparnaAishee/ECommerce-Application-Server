import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { cartController } from "./cart.controller";
import validateRequest from "../../../utils/validateRequest";
import { cartValidation } from "./cart.validation";

const router = Router();

router.post(
  "/add-to-cart",
  auth(Role.USER),
  validateRequest(cartValidation.addToCart),
  cartController.addToCart
);
router.get(
  "/my-cart-products",
  auth(Role.USER),
  cartController.getMyCartProducts
);
router.delete("/:cartId", auth(Role.USER), cartController.deleteMyCartProducts);

router.patch("/", auth(Role.USER), cartController.updateCartProductQuantity);

export const cartRoutes = router;
