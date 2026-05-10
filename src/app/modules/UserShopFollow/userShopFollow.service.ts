import { NotificationType, UserShopFollow } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";
import { notificationService } from "../Notification/notification.service";

const createShopFollowUser = async (user: IUser, payload: UserShopFollow) => {
  const isAlreadyFollowed = await prisma.userShopFollow.findUnique({
    where: {
      userId_shopId: {
        userId: user?.id,
        shopId: payload.shopId,
      },
    },
  });

  if (isAlreadyFollowed) {
    const result = await prisma.userShopFollow.delete({
      where: {
        userId_shopId: {
          userId: user?.id,
          shopId: payload.shopId,
        },
      },
    });
    return { result, message: "Unfollow the shop successfully" };
  }
  payload.userId = user?.id;
  const result = await prisma.userShopFollow.create({
    data: payload,
  });

  // Notify the vendor (shop owner) that someone followed their shop.
  const shop = await prisma.shop.findUnique({
    where: { id: payload.shopId },
    select: { userId: true, shopName: true },
  });
  if (shop?.userId && shop.userId !== user.id) {
    notificationService
      .create({
        userId: shop.userId,
        type: NotificationType.SHOP,
        title: `${user.name ?? "Someone"} followed your shop`,
        body: `${shop.shopName ?? "Your shop"} just gained a new follower.`,
        link: "/vendor",
      })
      .catch(() => {});
  }

  return { result, message: "Follow the shop successfully" };
};

const getAllMyFollowingShop = async (user: IUser) => {
  const followingShop = await prisma.userShopFollow.findMany({
    where: {
      userId: user?.id,
    },
  });

  return followingShop;
};
const getSingleMyFollowingShop = async (user: IUser, id: string) => {
  const followingShop = await prisma.userShopFollow.findUnique({
    where: {
      userId_shopId: {
        userId: user?.id,
        shopId: id,
      },
    },
  });

  return followingShop;
};

export const userShopFollow = {
  createShopFollowUser,
  getAllMyFollowingShop,
  getSingleMyFollowingShop,
};
