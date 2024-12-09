import { Router } from "express";
import auth from "../../../utils/auth";
import { Role } from "@prisma/client";
import { comparisonController } from "./comparison.controller";
import { comparisonValidation } from "./comparison.validation";
import validateRequest from "../../../utils/validateRequest";

const router = Router();

router.post(
  "/create-comparison",
  auth(Role.USER),
  validateRequest(comparisonValidation.createComparison),
  comparisonController.createComparison
);
router.get("/", auth(Role.USER), comparisonController.getMyComparisonProduct);

router.delete("/:id", auth(Role.USER), comparisonController.deleteComparison);

export const comparisonRoutes = router;
