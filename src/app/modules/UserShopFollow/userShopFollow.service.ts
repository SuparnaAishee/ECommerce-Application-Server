import { UserShopFollow } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";

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
