import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Chat, Message, User } from "../models";
import { Op, literal } from "sequelize";

interface SendMessageData {
  senderId: string;
  receiverId: string;
  message: string;
  messageType?: "text" | "image" | "video" | "file";
  attachments?: any[];
  isOnline: boolean;
}

// 🔹 Send Message (auto-create chat if not exists)
export const sendMessage = async (data: SendMessageData) => {
  const {
    senderId,
    receiverId,
    message,
    messageType = "text",
    attachments = [],
    isOnline,
  } = data;

  // 1️⃣ Find existing chat between both users
  let chat = await Chat.findOne({
    where: literal(`
      id IN (
        SELECT chatId
        FROM ChatParticipants
        WHERE userId IN ('${senderId}', '${receiverId}')
        GROUP BY chatId
        HAVING COUNT(DISTINCT userId) = 2
      )
    `),
  });

  // 2️⃣ If not found, create new chat and link participants
  if (!chat) {
    chat = await Chat.create();
    await chat.addParticipants([senderId, receiverId]);
  }

  // 3️⃣ Create new message
  const newMessage = await Message.create({
    senderId,
    receiverId,
    message,
    messageType,
    isRead: false,
    attachments,
    isDelivered: isOnline,
    chatId: chat.id,
  });

  // 4️⃣ Update lastMessage in chat
  await chat.update({ lastMessageId: newMessage.id });

  return { ...newMessage.dataValues, chatId: chat.id };
};

// 🔹 Get all messages between current user & receiver
export const getChatBetweenUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.params;
    const myId = req.user?.id;

    if (!myId) return res.status(401).json({ message: "Unauthorized" });

    // 1️⃣ Find the existing chat between both users
    const chat = await Chat.findOne({
      where: literal(`
        id IN (
          SELECT chatId
          FROM ChatParticipants
          WHERE userId IN ('${myId}', '${receiverId}')
          GROUP BY chatId
          HAVING COUNT(DISTINCT userId) = 2
        )
      `),
      include: [
        {
          model: User,
          as: "participants",
          attributes: ["id", "name", "email", "avatar"],
          through: { attributes: [] },
        },
        {
          model: Message,
          as: "lastMessage",
          attributes: ["id", "message", "messageType", "createdAt"],
        },
      ],
    });

    if (!chat)
      return res.status(404).json({ message: "No chat found", status: false });

    // 2️⃣ Fetch all messages between these users
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId },
          { senderId: receiverId, receiverId: myId },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      message: "Chat fetched successfully",
      status: true,
      chat,
      messages,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ message: "Something went wrong", status: false });
  }
};

// 🔹 Mark messages as read (API endpoint)
export const changeMessageReadStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { receiverId } = req.params;
    const myId = req.user?.id;
    if (!myId) return res.status(401).json({ message: "Unauthorized" });

    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          senderId: receiverId,
          receiverId: myId,
          isRead: false,
        },
      }
    );

    return res.json({
      status: true,
      updatedCount,
      message: "Messages marked as read",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: false, message: "Failed to mark messages as read" });
  }
};

// 🔹 Mark messages as read (utility for sockets)
export const markMessagesAsRead = async (
  senderId: string,
  receiverId: string
) => {
  const unreadMessages = await Message.findAll({
    where: {
      senderId,
      receiverId,
      isRead: false,
    },
    attributes: ["id"],
  });

  const messageIds = unreadMessages.map((msg) => msg.id);
  if (messageIds.length === 0) return [];

  await Message.update({ isRead: true }, { where: { id: messageIds } });
  return messageIds;
};
