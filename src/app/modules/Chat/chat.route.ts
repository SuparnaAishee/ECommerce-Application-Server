import { Router } from "express";
import validateRequest from "../../../utils/validateRequest";
import { chatValidation } from "./chat.validation";
import { chatController } from "./chat.controller";

const router = Router();

// Anonymous-friendly: no auth() middleware. The controller reads req.user?.id
// so logged-in shoppers get personalised responses, anonymous users still work.
router.post(
  "/",
  validateRequest(chatValidation.sendMessage),
  chatController.sendMessage,
);

export const chatRoutes = router;
