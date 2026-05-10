import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { notificationController } from "./notification.controller";

const router = Router();

// SSE stream — auth happens inside via ?token= (EventSource can't set headers)
router.get("/stream", notificationController.stream);

router.get(
  "/",
  auth(Role.USER, Role.VENDOR, Role.ADMIN),
  notificationController.getMyNotifications,
);

router.patch(
  "/read-all",
  auth(Role.USER, Role.VENDOR, Role.ADMIN),
  notificationController.markAllRead,
);

router.patch(
  "/:id/read",
  auth(Role.USER, Role.VENDOR, Role.ADMIN),
  notificationController.markRead,
);

export const notificationRoutes = router;
