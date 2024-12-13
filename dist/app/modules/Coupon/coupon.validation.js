"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponValidation = exports.createCoupon = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createCoupon = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string({ required_error: "Coupon code is required" }),
        discount: zod_1.z.number({ required_error: "Discount is required" }),
        discountType: zod_1.z.enum([client_1.DiscountType.FIXED, client_1.DiscountType.PERCENTAGE]),
        expiryDate: zod_1.z.string({ required_error: "Expiry date is required" }),
    }),
});
const validateCoupon = zod_1.z.object({
    body: zod_1.z.object({
        totalAmount: zod_1.z.number({ required_error: "Total amount is required" }),
        code: zod_1.z.string({ required_error: "Code is required" }),
    }),
});
exports.couponValidation = {
    createCoupon: exports.createCoupon,
    validateCoupon,
};
