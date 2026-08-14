import { Router } from "express";
const router = Router();

//Controllers
import ConversationController from "../controllers/ConversationController.js";

//Middlewares
import { authToken } from "../middlewares/authToken.js";

// Helpers
import { upload } from "../helpers/image-upload.js";

router.post(
  "/conversation/new",
  authToken,
  ConversationController.createConversation,
);
router.post(
  "/conversation/:conversation_id/message",
  authToken,
  upload.single("image"),
  ConversationController.sendMessageInConversation,
);
router.get(
  "/conversation/",
  authToken,
  ConversationController.getAllConversations,
);
router.get(
  "/conversation/:conversation_id/messages",
  authToken,
  ConversationController.getAllMessagesInConversation,
);

export default router;
