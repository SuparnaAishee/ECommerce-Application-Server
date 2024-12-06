import { DiscountType } from "@prisma/client";
import { z } from "zod";

export const createCoupon = z.object({
  body: z.object({
    code: z.string({ required_error: "Coupon code is required" }),
    discount: z.number({ required_error: "Discount is required" }),
    discountType: z.enum([DiscountType.FIXED, DiscountType.PERCENTAGE]),
    expiryDate: z.string({ required_error: "Expiry date is required" }),
  }),
});

export const couponValidation = {
  createCoupon,
};