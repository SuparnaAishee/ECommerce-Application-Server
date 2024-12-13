import { z } from "zod";

const addToWishlist = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }),
  }),
});

const removeFromWishlist = z.object({
  params: z.object({
    productId: z.string({ required_error: "Product ID is required" }),
  }),
});

export const wishlistValidation = {
  addToWishlist,
  removeFromWishlist,
};
