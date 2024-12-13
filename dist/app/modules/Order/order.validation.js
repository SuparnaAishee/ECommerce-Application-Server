"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderValidation = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const updateOrder = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([
            client_1.OrderStatus.COMPLETED,
            client_1.OrderStatus.PENDING,
            client_1.OrderStatus.CANCELLED,
        ]),
    }),
});
exports.orderValidation = {
    updateOrder,
};
