"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flashSaleRoutes = void 0;
const express_1 = require("express");
const flashSale_controller_1 = require("./flashSale.controller");
const router = (0, express_1.Router)();
router.get("/", flashSale_controller_1.flashSaleController.getAllFlashSale);
exports.flashSaleRoutes = router;
