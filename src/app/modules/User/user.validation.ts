import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

const createUser = z.object({
  body: z.object({
    password: z.string({ required_error: "Password id required" }),
    user: z.object({
      name: z.string({ required_error: "Name is required" }),
      email: z.string({ required_error: "Email is required" }).email(),
      role: z.enum([Role.USER, Role.VENDOR]),
    }),
  }),
});
const updateUserRoleStatus = z.object({
  body: z.object({
    role: z.enum([Role.ADMIN, Role.USER, Role.VENDOR]).optional(),
    isDeleted: z.boolean().optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
  }),
});

export const userValidation = {
  createUser,
  updateUserRoleStatus,
};
