"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidation = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const createUser = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string({ required_error: "Password id required" }),
        user: zod_1.z.object({
            name: zod_1.z.string({ required_error: "Name is required" }),
            email: zod_1.z.string({ required_error: "Email is required" }).email(),
            role: zod_1.z.enum([client_1.Role.USER, client_1.Role.VENDOR]),
        }),
    }),
});
const updateUserRoleStatus = zod_1.z.object({
    body: zod_1.z.object({
        role: zod_1.z.enum([client_1.Role.ADMIN, client_1.Role.USER, client_1.Role.VENDOR]).optional(),
        isDeleted: zod_1.z.boolean().optional(),
        status: zod_1.z.enum([client_1.UserStatus.ACTIVE, client_1.UserStatus.BLOCKED]).optional(),
    }),
});
exports.userValidation = {
    createUser,
    updateUserRoleStatus,
};
