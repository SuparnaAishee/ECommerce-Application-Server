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
exports.shopService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const fileUploader_1 = require("../../../utils/fileUploader");
const paginationHelper_1 = require("../../helpers/paginationHelper");
const createShop = (user, file, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user === null || user === void 0 ? void 0 : user.email,
            isDeleted: false,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User is not found");
    }
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    if (shop) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Already you have a shop");
    }
    payload.userId = userData === null || userData === void 0 ? void 0 : userData.id;
    if (file) {
        const { secure_url } = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        payload.shopLogo = secure_url;
    }
    const result = yield prisma_1.default.shop.create({
        data: payload,
    });
    return result;
});
const getAllShop = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const result = yield prisma_1.default.shop.findMany({
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
        include: { user: true },
    });
    const total = yield prisma_1.default.shop.count();
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
});
const getMyShop = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user.email,
        },
    });
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
        include: {
            orders: {
                include: {
                    product: true,
                },
            },
            products: true,
            follower: true,
            user: true,
        },
    });
    console.log({ shop });
    if ((shop === null || shop === void 0 ? void 0 : shop.status) === "BLOCKED") {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, "Your shop is been blocked by admin");
    }
    return shop;
});
const getSingleShop = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            id,
        },
        include: {
            products: true,
            follower: true,
            user: true,
        },
    });
    return shop;
});
const updateMyShop = (user, file, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user.email,
            isDeleted: false,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User is not found");
    }
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    if (!shop) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Shop is not found");
    }
    if ((shop === null || shop === void 0 ? void 0 : shop.status) === "BLOCKED") {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, "Your shop is been blocked by admin");
    }
    if (file) {
        const { secure_url } = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        payload.shopLogo = secure_url;
    }
    const result = yield prisma_1.default.shop.update({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
        data: payload,
    });
    return result;
});
const updateShopStatus = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            id: payload.shopId,
        },
    });
    if (!shop) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Shop is not found");
    }
    const result = yield prisma_1.default.shop.update({
        where: {
            id: payload.shopId,
        },
        data: {
            status: payload.status,
        },
    });
    return result;
});
const deleteMyShop = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user.email,
            isDeleted: false,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User is not found");
    }
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    if (!shop) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Shop is not found");
    }
    const result = yield prisma_1.default.shop.delete({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    return result;
});
exports.shopService = {
    createShop,
    getAllShop,
    getMyShop,
    updateMyShop,
    deleteMyShop,
    updateShopStatus,
    getSingleShop,
};
