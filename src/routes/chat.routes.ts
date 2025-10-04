import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getUserChats,
  createOrGetChat,
  getMessages,
  sendMessage,
} from "../controllers/chatController";

const router = express.Router();

// 🟢 Chats
router.get("/", protect, getUserChats);          // get all chats of user
router.post("/", protect, createOrGetChat);      // create/get chat with someone

// 🟢 Messages
router.get("/:chatId/messages", protect, getMessages);  // get messages of chat
router.post("/:chatId/messages", protect, sendMessage); // send message

export default router;
