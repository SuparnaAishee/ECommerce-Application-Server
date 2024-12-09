import { z } from "zod";

const createComparison = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product id is required" }),
  }),
});

export const comparisonValidation = {
  createComparison,
};
