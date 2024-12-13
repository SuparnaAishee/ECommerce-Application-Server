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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparisonService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const createComparison = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = payload, restPayload = __rest(payload, ["type"]);
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            id: user === null || user === void 0 ? void 0 : user.id,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User not found");
    }
    const product = yield prisma_1.default.product.findUnique({
        where: {
            id: payload.productId,
        },
    });
    if (!product) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const isThreeProductAdded = yield prisma_1.default.comparison.findMany({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    if (isThreeProductAdded && (isThreeProductAdded === null || isThreeProductAdded === void 0 ? void 0 : isThreeProductAdded.length) === 3) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Only Compare up to three products at a time");
    }
    const isComparisonProductExist = yield prisma_1.default.comparison.findUnique({
        where: {
            userId_productId: {
                userId: userData === null || userData === void 0 ? void 0 : userData.id,
                productId: product === null || product === void 0 ? void 0 : product.id,
            },
        },
    });
    if (isComparisonProductExist) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "This product is already exist in your selected comparison");
    }
    restPayload.userId = userData === null || userData === void 0 ? void 0 : userData.id;
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        if (type && type === "replaceProduct") {
            yield tx.comparison.deleteMany({
                where: {
                    userId: userData === null || userData === void 0 ? void 0 : userData.id,
                },
            });
        }
        const result = yield tx.comparison.create({
            data: restPayload,
        });
        return result;
    }));
    return result;
});
const getMyComparisonProduct = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            id: user === null || user === void 0 ? void 0 : user.id,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User not found");
    }
    const result = yield prisma_1.default.comparison.findMany({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
        include: {
            product: true,
            user: true,
        },
    });
    return result;
});
const deleteComparison = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.comparison.delete({
        where: {
            id,
        },
    });
});
exports.comparisonService = {
    createComparison,
    getMyComparisonProduct,
    deleteComparison,
};
