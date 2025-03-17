import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import validateRequest from "../../../utils/validateRequest";
import { wishlistValidation } from "./wishlist.validation";
import { wishlistController } from "./wishlist.controller";

const router = Router();

router.post(
  "/add-to-wishlist",
  auth(Role.USER),
  validateRequest(wishlistValidation.addToWishlist),
  wishlistController.addToWishlist
);
router.get(
  "/my-wishlist",
  auth(Role.USER),
  wishlistController.getMyWishlistProducts
);
router.delete(
  "/:wishlistId",
  auth(Role.USER),
  wishlistController.deleteMyWishlistProducts
);

router.patch(
  "/",
  auth(Role.USER),
  wishlistController.updateWishlistProductQuantity
);

export const wishlistRoutes = router;
