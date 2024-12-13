"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const review_controller_1 = require("./review.controller");
const router = (0, express_1.Router)();
router.post("/add-review", (0, auth_1.default)(client_1.Role.USER), review_controller_1.reviewController.addReviewToProduct);
exports.reviewRoutes = router;
