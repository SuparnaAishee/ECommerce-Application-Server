import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { orderController } from "./order.controller";
import validateRequest from "../../../utils/validateRequest";
import { orderValidation } from "./order.validation";

const router = Router();

router.post("/create-order", auth(Role.USER), orderController.createOrder);

router.get("/my-order", auth(Role.USER), orderController.getMyOrders);
router.get("/", auth(Role.ADMIN), orderController.getAllOrders);

router.delete(
  "/my-order/:orderId",
  auth(Role.USER),
  orderController.deleteMyOrder
);
router.patch(
  "/:orderId",
  auth(Role.ADMIN),
  validateRequest(orderValidation.updateOrder),
  orderController.updateOrderStatus
);

export const orderRoutes = router;
