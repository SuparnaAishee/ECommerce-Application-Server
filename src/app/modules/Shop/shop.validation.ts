import { ShopStatus } from "@prisma/client";
import { z } from "zod";

const createShop = z.object({
  body: z.object({
    shopName: z.string({ required_error: "Shop name is required" }),
    shopDetails: z
      .string({ required_error: "Shop details is required" })
      .optional(),
  }),
});
const updateShop = z.object({
  body: z.object({
    shopName: z.string({ required_error: "Shop name is required" }).optional(),
    shopDetails: z
      .string({ required_error: "Shop details is required" })
      .optional(),
  }),
});
const updateShopStatus = z.object({
  body: z.object({
    status: z.enum([ShopStatus.ACTIVE, ShopStatus.BLOCKED], {
      required_error: "Status is required",
    }),
    shopId: z.string({ required_error: "Shop id is required" }),
  }),
});

export const shopValidation = {
  createShop,
  updateShop,
  updateShopStatus,
};
