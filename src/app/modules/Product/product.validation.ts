import { z } from "zod";

const createProduct = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    description: z.string({ required_error: "Description is required" }),
    price: z.number({ required_error: "Price is required" }),
    inventory: z.number({ required_error: "Inventory is required" }),
    categoryId: z.string({ required_error: "Category id is required" }),
    discount: z.number({ required_error: "Discount is required" }).optional(),
  }),
});

const updateProduct = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).optional(),
    description: z
      .string({ required_error: "Description is required" })
      .optional(),
    price: z.number({ required_error: "Price is required" }).optional(),
    inventory: z.number({ required_error: "Inventory is required" }).optional(),
    categoryId: z
      .string({ required_error: "Category id is required" })
      .optional(),
    discount: z.number({ required_error: "Discount is required" }).optional(),
  }),
});

export const productValidation = {
  createProduct,
  updateProduct,
};
