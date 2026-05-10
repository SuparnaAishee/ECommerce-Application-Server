import { join } from "path";
import { verifyPayment } from "./payment.utils";
import { readFileSync } from "fs";
import prisma from "../../helpers/prisma";
import { NotificationType } from "@prisma/client";
import { notificationService } from "../Notification/notification.service";

const confirmationService = async (transactionId: string, status: string) => {
  let greeting;

  const order = await prisma.order.findFirst({
    where: {
      transactionId,
    },
  });

  const paymentVerifyRes = await verifyPayment(transactionId);
  if (paymentVerifyRes?.pay_status === "Successful") {
    await prisma.$transaction(async (tx) => {
      await prisma.cart.deleteMany({
        where: {
          userId: order?.userId,
        },
      });
      await prisma.order.updateMany({
        where: {
          transactionId,
        },
        data: {
          isPaid: true,
        },
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

  const filePath = join(__dirname, "../paymentConfirmation/index.html");
  let template = readFileSync(filePath, "utf-8");

  if (status === "success") {
    greeting = "Thank you for order!";
  } else {
    greeting = "Order failed try again";
  }

  template = template.replace("{{success}}", status);
  template = template.replace("{{greeting}}", greeting);
  template = template.replace("{{orderId}}", transactionId || "");

  return template;
};

export const paymentService = {
  confirmationService,
};
