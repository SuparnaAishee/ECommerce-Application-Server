import { NotificationType, Review } from "@prisma/client";
import { IUser } from "../User/user.interface";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { notificationService } from "../Notification/notification.service";

const addReviewToProduct = async (user: IUser, payload: Review) => {
  const product = await prisma.product.findUnique({
    where: {
      id: payload.productId,
    },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product is not found");
  }

  const isOrderedProduct = await prisma.order.findFirst({
    where: {
      productId: payload.productId,
      userId: user?.id,
    },
  });

  if (!isOrderedProduct) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You can add review only after purchase the Product"
    );
  }

  const review = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: user?.id,
        productId: payload.productId,
      },
    },
  });

  if (review) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already a review on this product"
    );
  }
  payload.userId = user?.id;

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: payload,
    });

    await tx.order.updateMany({
      where: {
        productId: payload.productId,
        userId: user.id,
      },
      data: {
        isReviewed: true,
      },
    });
    return review;
  });

  // Notify the vendor who owns the product
  const productWithShop = await prisma.product.findUnique({
    where: { id: payload.productId },
    select: { name: true, shop: { select: { userId: true } } },
  });
  if (
    productWithShop?.shop?.userId &&
    productWithShop.shop.userId !== user.id
  ) {
    notificationService
      .create({
        userId: productWithShop.shop.userId,
        type: NotificationType.REVIEW,
        title: `New review on ${productWithShop.name}`,
        body: `${user.name ?? "A customer"} left a ${payload.rating}-star review.`,
        link: "/vendor/manage-product",
      })
      .catch(() => {});
  }

  return result;
};

export const reviewService = {
  addReviewToProduct,
};
