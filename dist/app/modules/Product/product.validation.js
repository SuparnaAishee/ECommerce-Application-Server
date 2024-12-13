"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productValidation = void 0;
const zod_1 = require("zod");
const createProduct = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" }),
        description: zod_1.z.string({ required_error: "Description is required" }),
        price: zod_1.z.number({ required_error: "Price is required" }),
        inventory: zod_1.z.number({ required_error: "Inventory is required" }),
        categoryId: zod_1.z.string({ required_error: "Category id is required" }),
    }),
});
const updateProduct = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" }).optional(),
        description: zod_1.z
            .string({ required_error: "Description is required" })
            .optional(),
        price: zod_1.z.number({ required_error: "Price is required" }).optional(),
        inventory: zod_1.z.number({ required_error: "Inventory is required" }).optional(),
        categoryId: zod_1.z
            .string({ required_error: "Category id is required" })
            .optional(),
    }),
});
exports.productValidation = {
    createProduct,
    updateProduct,
};
