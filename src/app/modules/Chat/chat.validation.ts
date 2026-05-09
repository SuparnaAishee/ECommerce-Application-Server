import { z } from "zod";

const sendMessage = z.object({
  body: z.object({
    message: z
      .string({ required_error: "Message is required" })
      .trim()
      .min(1, "Message must not be empty")
      .max(2000, "Message must be under 2000 characters"),
  }),
});

export const chatValidation = {
  sendMessage,
};
