import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import config from "../../config";

export type ChatProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  shop?: string;
  category?: string;
  isFlashSale: boolean;
  discount_percentage: number | null;
};

export type ChatReply = {
  reply: string;
  intent: "SEARCH" | "RECOMMEND" | "ORDER_STATUS" | "FAQ";
  query: string;
  products: ChatProduct[];
  suggestions: string[];
};

const sendMessage = async (
  message: string,
  userId?: string,
): Promise<ChatReply> => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    config.n8n_request_timeout_ms,
  );

  try {
    const res = await fetch(config.n8n_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        `Chat assistant unavailable (${res.status})`,
      );
    }

    const json = (await res.json()) as { success?: boolean; data?: ChatReply };

    if (!json?.data) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Chat assistant returned an unexpected response",
      );
    }

    return json.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new AppError(
        httpStatus.GATEWAY_TIMEOUT,
        "Chat assistant timed out",
      );
    }
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Chat assistant unreachable",
    );
  } finally {
    clearTimeout(timer);
  }
};

export const chatService = {
  sendMessage,
};
