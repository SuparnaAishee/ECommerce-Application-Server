"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryValidation = void 0;
const zod_1 = require("zod");
const createCategory = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Category is required!" }),
    }),
});
const updateCategory = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Category is required!" }),
    }),
});
exports.categoryValidation = {
    createCategory,
    updateCategory,
};
