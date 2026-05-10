import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { initiatePayment } from "../payment/payment.utils";
import { DiscountType, NotificationType, OrderStatus } from "@prisma/client";
import { calculateDiscount } from "../../../utils/calculateDiscount";
import { IOrder } from "./order.interface";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";
import { notificationService } from "../Notification/notification.service";

type CreateOrderItem = {
  coupon?: string;
  productId: string;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  saveAddressToProfile?: boolean;
};

const createOrder = async (user: IUser, payload: CreateOrderItem[]) => {
  const userData = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userData) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  // Pull shipping info from the first item (the checkout page sends the same
  // shipping block on every cart item)
  const shippingName =
    payload[0]?.shippingName?.trim() || userData.name || "";
  const shippingPhone =
    payload[0]?.shippingPhone?.trim() || userData.phone || "";
  const shippingAddress =
    payload[0]?.shippingAddress?.trim() || userData.address || "";

  if (!shippingAddress) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Shipping address is required",
    );
  }

  // Optionally persist this address as the customer's default
  if (payload[0]?.saveAddressToProfile) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        address: shippingAddress,
        phone: shippingPhone || userData.phone,
      },
    });
  }

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
        shippingName,
        shippingPhone,
        shippingAddress,
      });
    }

    // Create all orders
    await tx.order.createMany({ data: orders });
  });

  const paymentData = {
    transactionId,
    amount: totalAmount,
    customerName: shippingName || userData?.name,
    customerAddress: shippingAddress,
    customerEmail: userData?.email,
    customerPhone: shippingPhone || "N/A",
  };

  const paymentSession = await initiatePayment(paymentData);

  // Fire a single "Order placed" notification per checkout — best-effort,
  // never block the response.
  notificationService
    .create({
      userId: user.id,
      type: NotificationType.ORDER_PLACED,
      title: "Order placed",
      body: `Transaction ${transactionId} created for ${payload.length} item${
        payload.length === 1 ? "" : "s"
      }. We'll let you know when it ships.`,
      link: "/account/order-history",
    })
    .catch(() => {});

  // Notify each vendor whose shop has at least one line in this order
  const shopOwnerIds = new Set<string>();
  const shopsTouched = new Set<string>();
  for (const item of payload) {
    const product = products.find((p) => p.id === item.productId);
    if (product?.shopId) shopsTouched.add(product.shopId);
  }
  if (shopsTouched.size > 0) {
    const shops = await prisma.shop.findMany({
      where: { id: { in: Array.from(shopsTouched) } },
      select: { userId: true },
    });
    for (const s of shops) shopOwnerIds.add(s.userId);
  }
  for (const ownerId of shopOwnerIds) {
    notificationService
      .create({
        userId: ownerId,
        type: NotificationType.ORDER_PLACED,
        title: "New order on your shop",
        body: `${shippingName || userData?.name || "A customer"} placed an order. Tap to fulfill.`,
        link: "/vendor/order-history",
      })
      .catch(() => {});
  }

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

// Vendor-driven status transitions. Each vendor can only advance orders that
// belong to one of *their* shops. We restrict which target statuses each role
// is allowed to set.
const VENDOR_ALLOWED_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.RETURNED,
];

const advanceOrderStatusByVendor = async (
  user: IUser,
  orderId: string,
  payload: { status: OrderStatus },
) => {
  if (!VENDOR_ALLOWED_STATUSES.includes(payload.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Status not allowed");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true },
  });
  if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");

  if (order.shop?.userId !== user.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update orders from your own shop",
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: payload.status },
  });

  notificationService
    .create({
      userId: order.userId,
      type: NotificationType.ORDER_STATUS,
      title: `Order ${payload.status.toLowerCase()}`,
      body: `Your order with ${order.shop?.shopName ?? "the shop"} is now ${payload.status.toLowerCase()}.`,
      link: "/account/order-history",
    })
    .catch(() => {});

  return updated;
};

const cancelMyOrder = async (user: IUser, orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  if (order.userId !== user.id) {
    throw new AppError(httpStatus.FORBIDDEN, "Not your order");
  }
  if (
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.CONFIRMED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This order can no longer be cancelled",
    );
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: order.productId },
    });
    if (product) {
      await tx.product.update({
        where: { id: order.productId },
        data: { inventory: product.inventory + order.quantity },
      });
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  });

  // Notify the vendor; customer initiated this so no self-notification.
  const shop = await prisma.shop.findUnique({
    where: { id: order.shopId },
    select: { userId: true, shopName: true },
  });
  if (shop?.userId) {
    notificationService
      .create({
        userId: shop.userId,
        type: NotificationType.ORDER_STATUS,
        title: "Order cancelled by customer",
        body: `Order ${order.transactionId} on ${shop.shopName ?? "your shop"} was cancelled. Inventory has been restocked.`,
        link: "/vendor/order-history",
      })
      .catch(() => {});
  }

  return cancelled;
};

const requestReturnByCustomer = async (user: IUser, orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  if (order.userId !== user.id) {
    throw new AppError(httpStatus.FORBIDDEN, "Not your order");
  }
  if (
    order.status !== OrderStatus.DELIVERED &&
    order.status !== OrderStatus.COMPLETED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Return can only be requested for delivered orders",
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.RETURN_REQUESTED },
  });

  notificationService
    .create({
      userId: user.id,
      type: NotificationType.ORDER_STATUS,
      title: "Return requested",
      body: `We logged your return request for order ${order.transactionId}. The vendor will reach out soon.`,
      link: "/account/order-history",
    })
    .catch(() => {});

  const shop = await prisma.shop.findUnique({
    where: { id: order.shopId },
    select: { userId: true, shopName: true },
  });
  if (shop?.userId) {
    notificationService
      .create({
        userId: shop.userId,
        type: NotificationType.ORDER_STATUS,
        title: "Return requested by customer",
        body: `Customer requested a return on order ${order.transactionId}.`,
        link: "/vendor/order-history",
      })
      .catch(() => {});
  }

  return updated;
};

export const orderService = {
  createOrder,
  getMyOrders,
  deleteMyOrders,
  getAllOrders,
  geShopOrders,
  updateOrderStatus,
  advanceOrderStatusByVendor,
  cancelMyOrder,
  requestReturnByCustomer,
};
