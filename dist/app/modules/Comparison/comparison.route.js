"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparisonRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const comparison_controller_1 = require("./comparison.controller");
const comparison_validation_1 = require("./comparison.validation");
const validateRequest_1 = __importDefault(require("../../../utils/validateRequest"));
const router = (0, express_1.Router)();
router.post("/create-comparison", (0, auth_1.default)(client_1.Role.USER), (0, validateRequest_1.default)(comparison_validation_1.comparisonValidation.createComparison), comparison_controller_1.comparisonController.createComparison);
router.get("/", (0, auth_1.default)(client_1.Role.USER), comparison_controller_1.comparisonController.getMyComparisonProduct);
router.delete("/:id", (0, auth_1.default)(client_1.Role.USER), comparison_controller_1.comparisonController.deleteComparison);
exports.comparisonRoutes = router;
