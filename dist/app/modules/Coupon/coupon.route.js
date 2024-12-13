"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRoutes = void 0;
const express_1 = require("express");
const coupon_controller_1 = require("./coupon.controller");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const coupon_validation_1 = require("./coupon.validation");
const validateRequest_1 = __importDefault(require("../../../utils/validateRequest"));
const router = (0, express_1.Router)();
router.post("/create-coupon", (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(coupon_validation_1.couponValidation.createCoupon), coupon_controller_1.couponController.createCoupon);
router.post("/validate-coupon", (0, auth_1.default)(client_1.Role.USER), (0, validateRequest_1.default)(coupon_validation_1.couponValidation.validateCoupon), coupon_controller_1.couponController.validateCoupon);
router.get("/", (0, auth_1.default)(client_1.Role.ADMIN), coupon_controller_1.couponController.getAllCoupon);
router.delete("/:couponId", (0, auth_1.default)(client_1.Role.ADMIN), coupon_controller_1.couponController.deleteCoupon);
exports.couponRoutes = router;
