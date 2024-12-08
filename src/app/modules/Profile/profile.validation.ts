import { z } from "zod";

const updateProfile = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
  }),
});

export const profileValidation = {
  updateProfile,
};
