"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparisonValidation = void 0;
const zod_1 = require("zod");
const createComparison = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string({ required_error: "Product id is required" }),
    }),
});
exports.comparisonValidation = {
    createComparison,
};
