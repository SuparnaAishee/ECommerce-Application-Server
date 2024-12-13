"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const cart_controller_1 = require("./cart.controller");
const validateRequest_1 = __importDefault(require("../../../utils/validateRequest"));
const cart_validation_1 = require("./cart.validation");
const router = (0, express_1.Router)();
router.post("/add-to-cart", (0, auth_1.default)(client_1.Role.USER), (0, validateRequest_1.default)(cart_validation_1.cartValidation.addToCart), cart_controller_1.cartController.addToCart);
router.get("/my-cart-products", (0, auth_1.default)(client_1.Role.USER), cart_controller_1.cartController.getMyCartProducts);
router.delete("/:cartId", (0, auth_1.default)(client_1.Role.USER), cart_controller_1.cartController.deleteMyCartProducts);
router.patch("/", (0, auth_1.default)(client_1.Role.USER), cart_controller_1.cartController.updateCartProductQuantity);
exports.cartRoutes = router;
