import { Response } from "express";
import Chat from "../models/Chat";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/authMiddleware";

// 🟢 Get all chats of logged-in user
export const getUserChats = async (req: AuthRequest, res: Response) => {
  try {
    const chats = await Chat.find({ participants: req.user?._id })
      .populate("participants", "name email")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats", error });
  }
};

// 🟢 Create or get chat between two users
export const createOrGetChat = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [req.user?._id, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user?._id, receiverId],
      });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat", error });
  }
};

// 🟢 Get messages of a chat
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
};

// 🟢 Send message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, message, messageType } = req.body;

    const newMessage = await Message.create({
      chatId: req.params.chatId,
      sender: req.user?._id,
      receiver: receiverId,
      message,
      messageType: messageType || "text",
    });

    // update lastMessage in chat
    await Chat.findByIdAndUpdate(req.params.chatId, { lastMessage: newMessage._id });

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
};
