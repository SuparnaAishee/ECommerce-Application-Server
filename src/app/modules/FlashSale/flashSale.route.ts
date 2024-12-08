import { Router } from "express";
import { flashSaleController } from "./flashSale.controller";

const router = Router();

router.get("/", flashSaleController.getAllFlashSale);

export const flashSaleRoutes = router;
