import { NotificationType } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { IUser } from "../User/user.interface";

type CreatePayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

const create = async (payload: CreatePayload) => {
  return prisma.notification.create({ data: payload });
};

const getMyNotifications = async (
  user: IUser,
  options: { limit?: number; cursor?: string } = {},
) => {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : {}),
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
  return { data: rows, unreadCount, nextCursor: rows[rows.length - 1]?.id };
};

const markRead = async (user: IUser, id: string) => {
  return prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
};

const markAllRead = async (user: IUser) => {
  return prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
};

export const notificationService = {
  create,
  getMyNotifications,
  markRead,
  markAllRead,
};
