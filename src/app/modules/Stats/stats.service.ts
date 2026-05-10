import { OrderStatus } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

const orderTotal = (o: {
  quantity: number;
  discountedPrice: number | null;
  product: { price: number; isFlashSale: boolean; discount_percentage: number | null };
}) => {
  if (o.discountedPrice != null) return o.discountedPrice;
  const p = o.product?.price ?? 0;
  if (o.product?.isFlashSale && o.product?.discount_percentage) {
    return (
      Math.round(
        p * (1 - o.product.discount_percentage / 100) * o.quantity * 100,
      ) / 100
    );
  }
  return p * o.quantity;
};

// Last-12-month bucketed revenue series (oldest → newest).
const buildMonthlyRevenue = (
  orders: Array<{
    createdAt: Date;
    quantity: number;
    discountedPrice: number | null;
    product: {
      price: number;
      isFlashSale: boolean;
      discount_percentage: number | null;
    };
  }>,
) => {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.set(monthKey(d), 0);
  }
  for (const o of orders) {
    const k = monthKey(o.createdAt);
    if (buckets.has(k)) {
      buckets.set(k, (buckets.get(k) ?? 0) + orderTotal(o));
    }
  }
  return Array.from(buckets.entries()).map(([key, value]) => {
    const [y, m] = key.split("-");
    const label = new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleString(
      undefined,
      { month: "short" },
    );
    return { month: label, revenue: Math.round(value * 100) / 100 };
  });
};

const computeStatusBreakdown = (
  orders: Array<{ status: OrderStatus }>,
): Record<OrderStatus, number> => {
  const out = {} as Record<OrderStatus, number>;
  for (const s of Object.values(OrderStatus)) out[s] = 0;
  for (const o of orders) out[o.status] = (out[o.status] ?? 0) + 1;
  return out;
};

// ---------- admin ----------

const getAdminStats = async () => {
  const now = Date.now();
  const weekAgo = new Date(now - WEEK);
  const twoWeeksAgo = new Date(now - 2 * WEEK);

  const yearAgo = new Date(now - 366 * DAY);

  const [
    totalOrders,
    ordersThisWeek,
    ordersPrevWeek,
    totalCustomers,
    customersThisWeek,
    customersPrevWeek,
    totalProducts,
    productsThisWeek,
    allOrdersForBreakdown,
    yearOrders,
    topShopsRaw,
    recentOrders,
    notificationsCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.count({
      where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({
      where: { role: "USER", createdAt: { gte: weekAgo } },
    }),
    prisma.user.count({
      where: {
        role: "USER",
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.findMany({ select: { status: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: yearAgo } },
      select: {
        createdAt: true,
        quantity: true,
        discountedPrice: true,
        isPaid: true,
        product: {
          select: {
            price: true,
            isFlashSale: true,
            discount_percentage: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.shop.findMany({
      select: {
        id: true,
        shopName: true,
        extraFollowers: true,
        _count: { select: { orders: true, products: true, follower: true } },
      },
      take: 50,
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        transactionId: true,
        status: true,
        quantity: true,
        discountedPrice: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        product: {
          select: { name: true, price: true, isFlashSale: true, discount_percentage: true, images: true },
        },
        shop: { select: { shopName: true } },
      },
    }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  // Compute totals over the joined order+product rows so non-discounted
  // orders (which have discountedPrice = null) still contribute.
  const paidYearOrders = yearOrders.filter((o) => o.isPaid);
  const totalRevenue = paidYearOrders.reduce(
    (s, o) => s + orderTotal(o as any),
    0,
  );
  const weekRevenue = paidYearOrders
    .filter((o) => o.createdAt >= weekAgo)
    .reduce((s, o) => s + orderTotal(o as any), 0);
  const prevWeekRevenue = paidYearOrders
    .filter((o) => o.createdAt >= twoWeeksAgo && o.createdAt < weekAgo)
    .reduce((s, o) => s + orderTotal(o as any), 0);
  const pctChange = (current: number, prev: number) =>
    prev === 0 ? (current === 0 ? 0 : 100) : ((current - prev) / prev) * 100;

  const revenueByCategory = new Map<string, number>();
  for (const o of yearOrders) {
    const cat = o.product?.category?.name ?? "Other";
    revenueByCategory.set(
      cat,
      (revenueByCategory.get(cat) ?? 0) + orderTotal(o as any),
    );
  }

  const topShops = topShopsRaw
    .map((s) => ({
      id: s.id,
      shopName: s.shopName,
      orders: s._count.orders,
      products: s._count.products,
      followers: s._count.follower + (s.extraFollowers ?? 0),
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  return {
    kpis: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowthPct: Math.round(pctChange(weekRevenue, prevWeekRevenue) * 10) / 10,
      totalOrders,
      ordersGrowthPct: Math.round(pctChange(ordersThisWeek, ordersPrevWeek) * 10) / 10,
      totalCustomers,
      customersGrowthPct: Math.round(pctChange(customersThisWeek, customersPrevWeek) * 10) / 10,
      totalProducts,
      productsAddedThisWeek: productsThisWeek,
    },
    statusBreakdown: computeStatusBreakdown(allOrdersForBreakdown),
    monthlyRevenue: buildMonthlyRevenue(yearOrders as any),
    revenueByCategory: Array.from(revenueByCategory.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    topShops,
    recentOrders,
    unreadNotifications: notificationsCount,
  };
};

// ---------- vendor ----------

const getVendorStats = async (user: IUser) => {
  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      shopName: true,
      shopLogo: true,
      extraFollowers: true,
      _count: { select: { follower: true, products: true } },
    },
  });
  if (!shop) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No shop is associated with this vendor",
    );
  }

  const now = Date.now();
  const weekAgo = new Date(now - WEEK);
  const twoWeeksAgo = new Date(now - 2 * WEEK);

  const [
    revenueAgg,
    weekRevenue,
    prevWeekRevenue,
    totalOrders,
    weekOrders,
    prevWeekOrders,
    allOrdersForBreakdown,
    yearOrders,
    productRows,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { shopId: shop.id, isPaid: true },
      _sum: { discountedPrice: true },
    }),
    prisma.order.aggregate({
      where: { shopId: shop.id, isPaid: true, createdAt: { gte: weekAgo } },
      _sum: { discountedPrice: true },
    }),
    prisma.order.aggregate({
      where: {
        shopId: shop.id,
        isPaid: true,
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
      _sum: { discountedPrice: true },
    }),
    prisma.order.count({ where: { shopId: shop.id } }),
    prisma.order.count({
      where: { shopId: shop.id, createdAt: { gte: weekAgo } },
    }),
    prisma.order.count({
      where: {
        shopId: shop.id,
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    prisma.order.findMany({
      where: { shopId: shop.id },
      select: { status: true },
    }),
    prisma.order.findMany({
      where: { shopId: shop.id, createdAt: { gte: new Date(now - 366 * DAY) } },
      select: {
        createdAt: true,
        quantity: true,
        discountedPrice: true,
        productId: true,
        product: {
          select: {
            price: true,
            isFlashSale: true,
            discount_percentage: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { shopId: shop.id },
      select: { id: true, name: true, images: true, inventory: true, price: true },
    }),
    prisma.order.findMany({
      where: { shopId: shop.id },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        quantity: true,
        discountedPrice: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        product: {
          select: { name: true, price: true, images: true, isFlashSale: true, discount_percentage: true },
        },
      },
    }),
    prisma.product.findMany({
      where: { shopId: shop.id, inventory: { lt: 10 } },
      select: { id: true, name: true, inventory: true, images: true },
      orderBy: { inventory: "asc" },
      take: 5,
    }),
  ]);

  const totalRevenue = revenueAgg._sum.discountedPrice ?? 0;
  const weekRev = weekRevenue._sum.discountedPrice ?? 0;
  const prevWeekRev = prevWeekRevenue._sum.discountedPrice ?? 0;
  const pctChange = (current: number, prev: number) =>
    prev === 0 ? (current === 0 ? 0 : 100) : ((current - prev) / prev) * 100;

  // Top products by order quantity
  const productQty = new Map<string, number>();
  for (const o of yearOrders) {
    productQty.set(o.productId, (productQty.get(o.productId) ?? 0) + o.quantity);
  }
  const topProducts = Array.from(productQty.entries())
    .map(([id, qty]) => {
      const product = productRows.find((p) => p.id === id);
      return product
        ? {
            id,
            name: product.name,
            image: product.images?.[0] ?? null,
            inventory: product.inventory,
            unitsSold: qty,
            revenue: Math.round(qty * product.price * 100) / 100,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b!.unitsSold ?? 0) - (a!.unitsSold ?? 0))
    .slice(0, 5);

  return {
    shop: {
      id: shop.id,
      shopName: shop.shopName,
      shopLogo: shop.shopLogo,
      followers:
        (shop._count.follower ?? 0) + (shop.extraFollowers ?? 0),
      products: shop._count.products,
    },
    kpis: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowthPct: Math.round(pctChange(weekRev, prevWeekRev) * 10) / 10,
      totalOrders,
      ordersGrowthPct: Math.round(pctChange(weekOrders, prevWeekOrders) * 10) / 10,
      followers:
        (shop._count.follower ?? 0) + (shop.extraFollowers ?? 0),
      productCount: shop._count.products,
    },
    statusBreakdown: computeStatusBreakdown(allOrdersForBreakdown),
    monthlyRevenue: buildMonthlyRevenue(yearOrders as any),
    topProducts,
    lowStock,
    recentOrders,
  };
};

export const statsService = {
  getAdminStats,
  getVendorStats,
};
