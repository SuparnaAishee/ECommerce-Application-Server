import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { initiatePayment } from "../payment/payment.utils";
import { DiscountType, OrderStatus } from "@prisma/client";
import { calculateDiscount } from "../../../utils/calculateDiscount";
import { IOrder } from "./order.interface";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";

const createOrder = async (
  user: IUser,
  payload: { coupon?: string; productId: string; quantity: number }[]
) => {
  const userData = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userData) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  // Validate Coupon
  const transactionId = `TXN-${Date.now()}`;
  let discount = 0;
  let discountType: DiscountType | null = null;
  if (payload[0]?.coupon) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: payload[0].coupon },
    });

    if (!coupon)
      throw new AppError(httpStatus.NOT_FOUND, "Invalid coupon code");
    if (new Date(coupon.expiryDate) < new Date()) {
      throw new AppError(httpStatus.BAD_REQUEST, "Coupon has expired");
    }

    discount = coupon.discount;
    discountType = coupon.discountType;
  }

  // Fetch all products
  const productIds = payload.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== payload.length) {
    throw new AppError(httpStatus.NOT_FOUND, "Some products are not found");
  }

  const orders: IOrder[] = [];
  let totalAmount = 0;

  // Transactional logic
  await prisma.$transaction(async (tx) => {
    for (const item of payload) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          `Product with ID ${item.productId} not found`
        );
      }

      // Check inventory
      if (product.inventory < item.quantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for product ${product.name}`
        );
      }

      // Apply flash sale discount if applicable
      const basePrice = product.isFlashSale
        ? calculateDiscount(product.price, product.discount_percentage!)
        : product.price;

      // Calculate price after coupon discount
      let finalPrice = basePrice * item.quantity;

      if (discountType) {
        finalPrice =
          discountType === "PERCENTAGE"
            ? calculateDiscount(finalPrice, discount)
            : finalPrice - discount;
      }

      // Determine if discount is applied
      const hasDiscount = product.isFlashSale || discountType;

      // Update total amount
      totalAmount += finalPrice;

      // Deduct inventory
      await tx.product.update({
        where: { id: product.id },
        data: { inventory: product.inventory - item.quantity },
      });

      // Prepare order data
      orders.push({
        transactionId,
        ...(hasDiscount && { discountedPrice: finalPrice }),
        quantity: item.quantity,
        isPaid: false,
        status: OrderStatus.PENDING,
        userId: user.id,
        shopId: product.shopId,
        productId: product.id,
      });
    }

    // Create all orders
    await tx.order.createMany({ data: orders });
  });

  const paymentData = {
    transactionId,
    amount: totalAmount,
    customerName: userData?.name,
    customerAddress: "N/A",
    customerEmail: userData?.email,
    customerPhone: "N/A",
  };

  const paymentSession = await initiatePayment(paymentData);
  return paymentSession;
};

const getAllOrders = async (user: IUser, options: IPaginationOptions) => {
  const { limit, skip, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);
  const orders = await prisma.order.findMany({
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      product: true,
      shop: true,
    },
  });

  const total = await prisma.order.count();
  return {
    meta: {
      total,
      page,
      limit,
    },
    data: orders,
  };
};

const getMyOrders = async (user: IUser, options: IPaginationOptions) => {
  const { limit, skip, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  const orders = await prisma.order.findMany({
    where: {
      userId: user?.id,
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      product: true,
      shop: true,
    },
  });

  const total = await prisma.order.count({
    where: {
      userId: user?.id,
    },
  });
  return {
    meta: {
      total,
      page,
      limit,
    },
    data: orders,
  };
};
const geShopOrders = async (shopId: string, options: IPaginationOptions) => {
  const { limit, skip, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  const orders = await prisma.order.findMany({
    where: {
      shopId,
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      product: true,
      shop: true,
    },
  });

  const total = await prisma.order.count({
    where: {
      shopId,
    },
  });
  return {
    meta: {
      total,
      page,
      limit,
    },
    data: orders,
  };
};

const deleteMyOrders = async (id: string) => {
  const isOrderExist = await prisma.order.findUnique({
    where: { id },
  });

  if (!isOrderExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Order is not found");
  }
  const orders = await prisma.order.delete({
    where: {
      id,
    },
  });

  return orders;
};
const updateOrderStatus = async (
  id: string,
  payload: { status: OrderStatus }
) => {
  const isOrderExist = await prisma.order.findUnique({
    where: { id },
  });

  if (!isOrderExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Order is not found");
  }
  const orders = await prisma.order.update({
    where: {
      id,
    },
    data: payload,
  });

  return orders;
};

export const orderService = {
  createOrder,
  getMyOrders,
  deleteMyOrders,
  getAllOrders,
  geShopOrders,
  updateOrderStatus,
};
