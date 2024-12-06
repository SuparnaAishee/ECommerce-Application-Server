import { z } from "zod";

const createCategory = z.object({
  body: z.object({
    name: z.string({ required_error: "Category is required!" }),
  }),
});
const updateCategory = z.object({
  body: z.object({
    name: z.string({ required_error: "Category is required!" }),
  }),
});

export const categoryValidation = {
  createCategory,
  updateCategory,
};
