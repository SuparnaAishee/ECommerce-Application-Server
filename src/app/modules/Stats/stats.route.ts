import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { statsController } from "./stats.controller";

const router = Router();

router.get("/admin", auth(Role.ADMIN), statsController.adminStats);
router.get("/vendor", auth(Role.VENDOR), statsController.vendorStats);

export const statsRoutes = router;
