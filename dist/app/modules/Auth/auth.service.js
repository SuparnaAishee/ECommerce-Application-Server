"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../errors/AppError");
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const config_1 = __importDefault(require("../../config"));
const sendEmail_1 = __importDefault(require("../../../utils/sendEmail"));
const fileUploader_1 = require("../../../utils/fileUploader");
const createUser = (file, payload, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (user) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "This user is already exist");
    }
    if (file) {
        const { secure_url } = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        payload.profilePhoto = secure_url;
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, Number(config_1.default.bcrypt_salt_round));
    const userData = Object.assign(Object.assign({}, payload), { password: hashedPassword });
    const result = yield prisma_1.default.user.create({
        data: userData,
    });
    const accessToken = jwtHelper_1.jwtHelper.generateToken({
        email: result.email,
        role: result.role,
        profilePhoto: result.profilePhoto,
        name: result.name,
        id: result.id,
    }, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = jwtHelper_1.jwtHelper.generateToken({
        email: result.email,
        role: result.role,
        profilePhoto: result.profilePhoto,
        name: result.name,
        id: result.id,
    }, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        accessToken,
        refreshToken,
    };
});
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            isDeleted: false,
        },
    });
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.password, user.password);
    if (!isPasswordMatched) {
        throw new Error("Password incorrect!");
    }
    const accessToken = jwtHelper_1.jwtHelper.generateToken({
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        name: user.name,
        id: user.id,
    }, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = jwtHelper_1.jwtHelper.generateToken({
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        name: user.name,
        id: user.id,
    }, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        accessToken,
        refreshToken,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedData;
    try {
        decodedData = jwtHelper_1.jwtHelper.verifyToken(token, "abcdefgh");
    }
    catch (error) {
        throw new Error("You are not authorized!");
    }
    const user = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            isDeleted: false,
        },
    });
    const accessToken = jwtHelper_1.jwtHelper.generateToken({ email: user.email, role: user.role }, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    return accessToken;
});
const changePassword = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: user.email,
            isDeleted: false,
        },
    });
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.oldPassword, userData.password);
    if (!isPasswordMatched) {
        throw new Error("Password incorrect!");
    }
    const hashedPassword = yield bcrypt_1.default.hash(payload.newPassword, 12);
    yield prisma_1.default.user.update({
        where: {
            email: user.email,
        },
        data: {
            password: hashedPassword,
        },
    });
    return { message: "Password changed successfully!" };
});
const forgotPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            isDeleted: false,
        },
    });
    const token = jwtHelper_1.jwtHelper.generateToken({ email: user.email, role: user.role }, config_1.default.reset_password_secret, config_1.default.reset_password_expires_in);
    const link = `${config_1.default.client_base_url}/reset-password?email=${user.email}&token=${token}`;
    yield (0, sendEmail_1.default)(user.email, `
    <a href=${link}>Reset Password</a>
    
    `);
});
const resetPassword = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, "You are not authorized!");
    }
    const verifyToken = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.reset_password_secret);
    if (verifyToken && verifyToken.email !== payload.email) {
        throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, "You are not authorized!");
    }
    const user = yield prisma_1.default.user.findUnique({
        where: {
            email: verifyToken.email,
            isDeleted: false,
        },
    });
    if (!user) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User not found!");
    }
    const hashedPassword = yield bcrypt_1.default.hash(payload.password, 12);
    yield prisma_1.default.user.update({
        where: {
            email: verifyToken.email,
            isDeleted: false,
        },
        data: {
            password: hashedPassword,
        },
    });
});
exports.authService = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    createUser,
};
