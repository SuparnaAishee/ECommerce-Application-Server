"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../utils/auth"));
const client_1 = require("@prisma/client");
const profile_controller_1 = require("./profile.controller");
const fileUploader_1 = require("../../../utils/fileUploader");
const parseRequest_1 = __importDefault(require("../../../utils/parseRequest"));
const validateRequest_1 = __importDefault(require("../../../utils/validateRequest"));
const profile_validation_1 = require("./profile.validation");
const router = (0, express_1.Router)();
router.post("/update-profile", (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.VENDOR), fileUploader_1.fileUploader.upload.single("file"), parseRequest_1.default, (0, validateRequest_1.default)(profile_validation_1.profileValidation.updateProfile), profile_controller_1.profileController.updateProfile);
router.get("/my-profile", (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.VENDOR), profile_controller_1.profileController.getMyProfile);
exports.profileRoutes = router;
