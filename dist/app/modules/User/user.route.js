"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = __importDefault(require("../../../utils/validateRequest"));
const user_validation_1 = require("./user.validation");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get("/", (0, auth_1.default)(client_1.Role.ADMIN), user_controller_1.userController.getAllUser);
router.patch("/update/:userId", (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(user_validation_1.userValidation.updateUserRoleStatus), user_controller_1.userController.updateUserRoleStatus);
exports.userRoutes = router;
