"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileValidation = void 0;
const zod_1 = require("zod");
const updateProfile = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" }),
    }),
});
exports.profileValidation = {
    updateProfile,
};
