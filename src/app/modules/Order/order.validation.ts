import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const updateOrder = z.object({
  body: z.object({
    status: z.enum([
      OrderStatus.COMPLETED,
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
    ]),
  }),
});

export const orderValidation = {
  updateOrder,
};
