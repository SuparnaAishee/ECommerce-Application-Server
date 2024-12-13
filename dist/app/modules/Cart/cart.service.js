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
exports.cartService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const addToCart = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = payload, restPayload = __rest(payload, ["type"]);
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user.email,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "user is not found");
    }
    const product = yield prisma_1.default.product.findUnique({
        where: {
            id: payload.productId,
        },
    });
    if (!product) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Product is not found");
    }
    if (product.inventory === 0 || product.inventory < payload.quantity) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "insufficient  product quantity");
    }
    const isAddedToCart = yield prisma_1.default.cart.findUnique({
        where: {
            productId: payload === null || payload === void 0 ? void 0 : payload.productId,
        },
    });
    if (isAddedToCart) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "This product is already in your cart");
    }
    restPayload.userId = userData.id;
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(type);
        if ((payload === null || payload === void 0 ? void 0 : payload.type) && (payload === null || payload === void 0 ? void 0 : payload.type) === "replaceProduct") {
            yield tx.cart.deleteMany({
                where: {
                    userId: user === null || user === void 0 ? void 0 : user.id,
                },
            });
        }
        const cartData = yield tx.cart.create({
            data: restPayload,
            include: {
                product: {
                    include: {
                        shop: true,
                    },
                },
            },
        });
        return cartData;
    }));
    return result;
});
const getMyCartProduct = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const cartProduct = yield prisma_1.default.cart.findMany({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
        },
        include: {
            product: true,
            user: true,
        },
    });
    return cartProduct;
});
const deleteMyCartProduct = (user, id) => __awaiter(void 0, void 0, void 0, function* () {
    const cartProduct = yield prisma_1.default.cart.findUnique({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
            id,
        },
    });
    if (!cartProduct) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Cart product is not found!");
    }
    const result = yield prisma_1.default.cart.delete({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
            id,
        },
    });
    return result;
});
const updateCartProductQuantity = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const cartProduct = yield prisma_1.default.cart.findUnique({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
            id: payload.productId,
        },
    });
    if (!cartProduct) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Cart product is not found!");
    }
    const result = yield prisma_1.default.cart.update({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
            id: payload.productId,
        },
        data: {
            quantity: {
                [payload.type]: payload.quantity,
            },
        },
    });
    return result;
});
exports.cartService = {
    addToCart,
    getMyCartProduct,
    deleteMyCartProduct,
    updateCartProductQuantity,
};
