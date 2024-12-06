import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { initiatePayment } from "../payment/payment.utils";
import { OrderStatus } from "@prisma/client";

const createOrder = async (
  user: IUser,
  payload: { productId: string; quantity: number }[]
) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User is not found");
  }

  const productIds = payload.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== payload.length) {
    throw new AppError(httpStatus.NOT_FOUND, "Some products are not found");
  }

  let totalAmount = 0;

  for (const item of payload) {
    const product = products.find((p) => p.id === item.productId);

    if (!product) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `Product with ID ${item.productId} is not found`
      );
    }

    if (product.inventory < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Insufficient quantity for product ${product.name}`
      );
    }

    totalAmount += product.price * item.quantity;
  }

  const transactionId = `TXN-${Date.now()}`;

  const orders = [];
  for (const item of payload) {
    const product = products.find((p) => p.id === item.productId);

    await prisma.product.update({
      where: { id: product!.id },
      data: { inventory: product!.inventory - item.quantity },
    });

    // Create an order entry
    const order = {
      transactionId,
      quantity: item.quantity,
      userId: user.id,
      shopId: product!.shopId,
      productId: product!.id,
    };
    orders.push(order);
  }
  await prisma.order.createMany({
    data: orders,
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

const getAllOrders = async (user: IUser) => {
  const orders = await prisma.order.findMany({
    include: {
      product: true,
      shop: true,
    },
  });

  return orders;
};

const getMyOrders = async (user: IUser) => {
  const orders = await prisma.order.findMany({
    where: {
      userId: user?.id,
    },
    include: {
      product: true,
      shop: true,
    },
  });

  return orders;
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
  updateOrderStatus,
};
