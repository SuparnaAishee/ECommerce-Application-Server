import { join } from "path";
import { verifyPayment } from "./payment.utils";
import { readFileSync } from "fs";
import prisma from "../../helpers/prisma";
import { NotificationType } from "@prisma/client";
import { notificationService } from "../Notification/notification.service";
import config from "../../config";

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const confirmationService = async (transactionId: string, status: string) => {
  const order = await prisma.order.findFirst({
    where: { transactionId },
    include: {
      product: { select: { name: true, images: true } },
      shop: { select: { shopName: true } },
    },
  });

  let isSuccess = status === "success";
  if (isSuccess) {
    // Verify with gateway only when the redirect claims success; if the
    // gateway disagrees we degrade to the failed state for display.
    const paymentVerifyRes = await verifyPayment(transactionId);
    if (paymentVerifyRes?.pay_status !== "Successful") {
      isSuccess = false;
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.cart.deleteMany({ where: { userId: order?.userId } });
        await tx.order.updateMany({
          where: { transactionId },
          data: { isPaid: true },
        });
      });

      if (order?.userId) {
        notificationService
          .create({
            userId: order.userId,
            type: NotificationType.ORDER_STATUS,
            title: "Payment confirmed",
            body: `Payment for ${transactionId} is confirmed. Your order is now in the queue.`,
            link: "/account/order-history",
          })
          .catch(() => {});
      }
    }
  }

  const filePath = join(__dirname, "../paymentConfirmation/index.html");
  let template = readFileSync(filePath, "utf-8");

  const now = new Date();
  const placedAt = now.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const productName = order?.product?.name ?? "Your order";
  const productImage = order?.product?.images?.[0] ?? "";
  const shopName = order?.shop?.shopName ?? "Dokan Express";

  const replacements: Record<string, string> = {
    "{{isSuccess}}": String(isSuccess),
    "{{title}}": isSuccess ? "Order confirmed" : "Payment failed",
    "{{subtitle}}": isSuccess
      ? "Thank you. We've sent a confirmation email with your order details."
      : "We couldn't process your payment. No charge was made — please try again.",
    "{{orderId}}": escapeHtml(transactionId || ""),
    "{{placedAt}}": escapeHtml(placedAt),
    "{{productName}}": escapeHtml(productName),
    "{{productImage}}": escapeHtml(productImage),
    "{{shopName}}": escapeHtml(shopName),
    "{{clientUrl}}": config.client_base_url ?? "/",
    "{{accentClass}}": isSuccess ? "success" : "failed",
  };

  for (const [key, val] of Object.entries(replacements)) {
    template = template.split(key).join(val);
  }

  return template;
};

export const paymentService = {
  confirmationService,
};
