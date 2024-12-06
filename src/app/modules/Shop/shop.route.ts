import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { shopController } from "./shop.controller";
import validateRequest from "../../../utils/validateRequest";
import { shopValidation } from "./shop.validation";
import { fileUploader } from "../../../utils/fileUploader";
import parseRequest from "../../../utils/parseRequest";

const router = Router();

router.post(
  "/create-shop",
  auth(Role.VENDOR),
  fileUploader.upload.single("file"),
  parseRequest,
  validateRequest(shopValidation.createShop),
  shopController.createShop
);

router.get("/", auth(Role.ADMIN), shopController.getAllShop);
router.get("/single-shop/:shopId", shopController.getSingleShop);
router.get("/my-shop", auth(Role.VENDOR), shopController.getMyShop);

router.patch(
  "/my-shop",
  auth(Role.VENDOR),
  fileUploader.upload.single("file"),
  parseRequest,
  validateRequest(shopValidation.updateShop),
  shopController.updateMyShop
);
router.patch(
  "/status",
  auth(Role.ADMIN),
  validateRequest(shopValidation.updateShopStatus),
  shopController.updateShopStatus
);
router.delete("/my-shop", auth(Role.VENDOR), shopController.deleteMyShop);

export const shopRoutes = router;
