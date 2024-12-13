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
exports.reviewService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const addReviewToProduct = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_1.default.product.findUnique({
        where: {
            id: payload.productId,
        },
    });
    if (!product) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Product is not found");
    }
    const isOrderedProduct = yield prisma_1.default.order.findFirst({
        where: {
            productId: payload.productId,
            userId: user === null || user === void 0 ? void 0 : user.id,
        },
    });
    if (!isOrderedProduct) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "You can add review only after purchase the Product");
    }
    const review = yield prisma_1.default.review.findUnique({
        where: {
            userId_productId: {
                userId: user === null || user === void 0 ? void 0 : user.id,
                productId: payload.productId,
            },
        },
    });
    if (review) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "You have already a review on this product");
    }
    payload.userId = user === null || user === void 0 ? void 0 : user.id;
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const review = yield tx.review.create({
            data: payload,
        });
        yield tx.order.updateMany({
            where: {
                productId: payload.productId,
                userId: user.id,
            },
            data: {
                isReviewed: true,
            },
        });
        return review;
    }));
    return result;
});
exports.reviewService = {
    addReviewToProduct,
};
