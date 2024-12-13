"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userShopFollowRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const validateRequest_1 = __importDefault(require("../../../utils/validateRequest"));
const userShopFollow_validation_1 = require("./userShopFollow.validation");
const userShopFollow_controller_1 = require("./userShopFollow.controller");
const router = (0, express_1.Router)();
router.post("/", (0, auth_1.default)(client_1.Role.USER), (0, validateRequest_1.default)(userShopFollow_validation_1.userShopFollowValidation.createUserShopFollow), userShopFollow_controller_1.userShopFollowController.createUserShopFollow);
router.get("/", (0, auth_1.default)(client_1.Role.USER), userShopFollow_controller_1.userShopFollowController.getAllMyFollowingShop);
router.get("/:shopId", (0, auth_1.default)(client_1.Role.USER), userShopFollow_controller_1.userShopFollowController.getSingleMyFollowingShop);
exports.userShopFollowRoutes = router;
