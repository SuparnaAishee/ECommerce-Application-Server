import { z } from "zod";

const updateProfile = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z
      .string()
      .max(30, "Phone is too long")
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .max(500, "About me is too long (500 chars max)")
      .optional()
      .or(z.literal("")),
    address: z
      .string()
      .max(300, "Address is too long")
      .optional()
      .or(z.literal("")),
  }),
});

export const profileValidation = {
  updateProfile,
};
