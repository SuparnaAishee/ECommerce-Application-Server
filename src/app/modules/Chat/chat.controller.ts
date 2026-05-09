import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { chatService } from "./chat.service";

const sendMessage = catchAsync(async (req, res) => {
  const { message } = req.body as { message: string };
  const userId = req.user?.id;

  const result = await chatService.sendMessage(message, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat reply generated",
    data: result,
  });
});

export const chatController = {
  sendMessage,
};
