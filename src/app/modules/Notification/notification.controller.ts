import { Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { notificationService } from "./notification.service";
import { jwtHelper } from "../../helpers/jwtHelper";
import config from "../../config";
import { addClient, removeClient } from "./notification.events";

const getMyNotifications = catchAsync(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const result = await notificationService.getMyNotifications(req.user, {
    limit,
    cursor,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved",
    data: result,
  });
});

const markRead = catchAsync(async (req, res) => {
  await notificationService.markRead(req.user, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked read",
    data: null,
  });
});

const markAllRead = catchAsync(async (req, res) => {
  await notificationService.markAllRead(req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked read",
    data: null,
  });
});

// SSE — keeps the response open and writes a `data: …` line every time a new
// notification fires for this user. Auth via `?token=` because browser
// EventSource can't set Authorization headers.
const stream = (req: Request, res: Response) => {
  const token = (req.query.token as string | undefined) ?? "";
  let userId: string;
  try {
    const verified = jwtHelper.verifyToken(
      token,
      config.jwt_access_secret as Secret,
    );
    userId = (verified as { id: string }).id;
    if (!userId) throw new Error("missing id in token");
  } catch {
    res.status(401).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  res.write(`retry: 5000\n\n`);
  res.write(`data: ${JSON.stringify({ type: "hello" })}\n\n`);

  const client = addClient(userId, res);

  // Heartbeat every 25s so proxies don't kill the connection
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      // ignore — close handler will clean up
    }
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(userId, client);
  });
};

export const notificationController = {
  getMyNotifications,
  markRead,
  markAllRead,
  stream,
};
