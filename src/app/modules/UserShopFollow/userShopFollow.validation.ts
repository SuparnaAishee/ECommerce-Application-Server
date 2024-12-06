import { z } from "zod";

const createUserShopFollow = z.object({
  body: z.object({
    shopId: z.string({ required_error: "Shop id is required" }),
  }),
});

export const userShopFollowValidation = {
  createUserShopFollow,
};
