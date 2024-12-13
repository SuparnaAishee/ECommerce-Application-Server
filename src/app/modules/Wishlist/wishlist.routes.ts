import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { wishlistController } from "./wishlist.controller";
import { wishlistValidation } from "./wishlist.validation";
import validateRequest from "../../../utils/validateRequest";

const router = Router();

router.post(
  "/add",
  auth(Role.USER),
  validateRequest(wishlistValidation.addToWishlist),
  wishlistController.addToWishlist
);

router.get("/", auth(Role.USER), wishlistController.getWishlist);

router.delete(
  "/remove/:productId",
  auth(Role.USER),
  validateRequest(wishlistValidation.removeFromWishlist),
  wishlistController.removeFromWishlist
);

export const wishlistRoutes = router;
