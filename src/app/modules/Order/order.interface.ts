import { OrderStatus } from "@prisma/client";

export interface IOrder {
  transactionId: string;
  discountedPrice?: number;
  quantity: number;
  isPaid: boolean;
  status: OrderStatus;
  userId: string;
  shopId: string;
  productId: string;
}
