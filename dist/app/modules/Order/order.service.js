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
exports.orderService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const payment_utils_1 = require("../payment/payment.utils");
const client_1 = require("@prisma/client");
const calculateDiscount_1 = require("../../../utils/calculateDiscount");
const paginationHelper_1 = require("../../helpers/paginationHelper");
const createOrder = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userData = yield prisma_1.default.user.findUnique({ where: { id: user.id } });
    if (!userData)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User not found");
    // Validate Coupon
    const transactionId = `TXN-${Date.now()}`;
    let discount = 0;
    let discountType = null;
    if ((_a = payload[0]) === null || _a === void 0 ? void 0 : _a.coupon) {
        const coupon = yield prisma_1.default.coupon.findUnique({
            where: { code: payload[0].coupon },
        });
        if (!coupon)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Invalid coupon code");
        if (new Date(coupon.expiryDate) < new Date()) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Coupon has expired");
        }
        discount = coupon.discount;
        discountType = coupon.discountType;
    }
    // Fetch all products
    const productIds = payload.map((item) => item.productId);
    const products = yield prisma_1.default.product.findMany({
        where: { id: { in: productIds } },
    });
    if (products.length !== payload.length) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Some products are not found");
    }
    const orders = [];
    let totalAmount = 0;
    // Transactional logic
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        for (const item of payload) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, `Product with ID ${item.productId} not found`);
            }
            // Check inventory
            if (product.inventory < item.quantity) {
                throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Insufficient stock for product ${product.name}`);
            }
            // Apply flash sale discount if applicable
            const basePrice = product.isFlashSale
                ? (0, calculateDiscount_1.calculateDiscount)(product.price, product.discount_percentage)
                : product.price;
            // Calculate price after coupon discount
            let finalPrice = basePrice * item.quantity;
            if (discountType) {
                finalPrice =
                    discountType === "PERCENTAGE"
                        ? (0, calculateDiscount_1.calculateDiscount)(finalPrice, discount)
                        : finalPrice - discount;
            }
            // Determine if discount is applied
            const hasDiscount = product.isFlashSale || discountType;
            // Update total amount
            totalAmount += finalPrice;
            // Deduct inventory
            yield tx.product.update({
                where: { id: product.id },
                data: { inventory: product.inventory - item.quantity },
            });
            // Prepare order data
            orders.push(Object.assign(Object.assign({ transactionId }, (hasDiscount && { discountedPrice: finalPrice })), { quantity: item.quantity, isPaid: false, status: client_1.OrderStatus.PENDING, userId: user.id, shopId: product.shopId, productId: product.id }));
        }
        // Create all orders
        yield tx.order.createMany({ data: orders });
    }));
    const paymentData = {
        transactionId,
        amount: totalAmount,
        customerName: userData === null || userData === void 0 ? void 0 : userData.name,
        customerAddress: "N/A",
        customerEmail: userData === null || userData === void 0 ? void 0 : userData.email,
        customerPhone: "N/A",
    };
    const paymentSession = yield (0, payment_utils_1.initiatePayment)(paymentData);
    return paymentSession;
});
const getAllOrders = (user, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const orders = yield prisma_1.default.order.findMany({
        skip,
        take: limit,
        orderBy: sortBy && sortOrder
            ? {
                [sortBy]: sortOrder,
            }
            : {
                createdAt: "desc",
            },
        include: {
            product: true,
            shop: true,
        },
    });
    const total = yield prisma_1.default.order.count();
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: orders,
    };
});
const getMyOrders = (user, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const orders = yield prisma_1.default.order.findMany({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
        },
        skip,
        take: limit,
        orderBy: sortBy && sortOrder
            ? {
                [sortBy]: sortOrder,
            }
            : {
                createdAt: "desc",
            },
        include: {
            product: true,
            shop: true,
        },
    });
    const total = yield prisma_1.default.order.count({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
        },
    });
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: orders,
    };
});
const geShopOrders = (shopId, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const orders = yield prisma_1.default.order.findMany({
        where: {
            shopId,
        },
        skip,
        take: limit,
        orderBy: sortBy && sortOrder
            ? {
                [sortBy]: sortOrder,
            }
            : {
                createdAt: "desc",
            },
        include: {
            product: true,
            shop: true,
        },
    });
    const total = yield prisma_1.default.order.count({
        where: {
            shopId,
        },
    });
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: orders,
    };
});
const deleteMyOrders = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isOrderExist = yield prisma_1.default.order.findUnique({
        where: { id },
    });
    if (!isOrderExist) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Order is not found");
    }
    const orders = yield prisma_1.default.order.delete({
        where: {
            id,
        },
    });
    return orders;
});
const updateOrderStatus = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isOrderExist = yield prisma_1.default.order.findUnique({
        where: { id },
    });
    if (!isOrderExist) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Order is not found");
    }
    const orders = yield prisma_1.default.order.update({
        where: {
            id,
        },
        data: payload,
    });
    return orders;
});
exports.orderService = {
    createOrder,
    getMyOrders,
    deleteMyOrders,
    getAllOrders,
    geShopOrders,
    updateOrderStatus,
};
