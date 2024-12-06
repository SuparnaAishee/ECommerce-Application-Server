import { z } from "zod";

const addToCart = z.object({
  body: z.object({
    quantity: z.number({ required_error: "quantity is required" }),
    productId: z.string({ required_error: "Product id is required" }),
  }),
});

export const cartValidation = {
  addToCart,
};
