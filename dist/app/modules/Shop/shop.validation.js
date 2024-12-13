"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopValidation = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const createShop = zod_1.z.object({
    body: zod_1.z.object({
        shopName: zod_1.z.string({ required_error: "Shop name is required" }),
        shopDetails: zod_1.z
            .string({ required_error: "Shop details is required" })
            .optional(),
    }),
});
const updateShop = zod_1.z.object({
    body: zod_1.z.object({
        shopName: zod_1.z.string({ required_error: "Shop name is required" }).optional(),
        shopDetails: zod_1.z
            .string({ required_error: "Shop details is required" })
            .optional(),
    }),
});
const updateShopStatus = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([client_1.ShopStatus.ACTIVE, client_1.ShopStatus.BLOCKED], {
            required_error: "Status is required",
        }),
        shopId: zod_1.z.string({ required_error: "Shop id is required" }),
    }),
});
exports.shopValidation = {
    createShop,
    updateShop,
    updateShopStatus,
};
