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
exports.couponService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const paginationHelper_1 = require("../../helpers/paginationHelper");
const createCoupon = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield prisma_1.default.coupon.findUnique({
        where: {
            code: payload.code,
        },
    });
    if (coupon) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "You have already a coupon code in this name");
    }
    const result = yield prisma_1.default.coupon.create({
        data: payload,
    });
    return result;
});
const validateCoupon = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield prisma_1.default.coupon.findUnique({
        where: {
            code: payload.code,
        },
    });
    if (!coupon) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Coupon code is not found");
    }
    if ((coupon === null || coupon === void 0 ? void 0 : coupon.status) === "INACTIVE") {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `This coupon is now ${coupon === null || coupon === void 0 ? void 0 : coupon.status}`);
    }
    if ((payload === null || payload === void 0 ? void 0 : payload.totalAmount) < (coupon === null || coupon === void 0 ? void 0 : coupon.minimumOrderValue)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Minimum order amount is ${coupon === null || coupon === void 0 ? void 0 : coupon.minimumOrderValue}`);
    }
    if ((coupon === null || coupon === void 0 ? void 0 : coupon.usageLimit) === 0) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Coupon usage limit is finish`);
    }
    const [day, month, year] = coupon === null || coupon === void 0 ? void 0 : coupon.expiryDate.split("-").map(Number);
    const formattedDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (formattedDate < currentDate) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Coupon Date is expired`);
    }
    return coupon;
});
const getAllCoupon = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const result = yield prisma_1.default.coupon.findMany({
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
    });
    const total = yield prisma_1.default.coupon.count();
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
});
const deleteCoupon = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield prisma_1.default.coupon.delete({
        where: {
            id,
        },
    });
    return coupon;
});
exports.couponService = {
    createCoupon,
    getAllCoupon,
    deleteCoupon,
    validateCoupon,
};
