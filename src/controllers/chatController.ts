import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";
import { Op } from "sequelize";

interface SendMessageData {
  senderId: number;
  receiverId: number;
  message: string;
  messageType?: "text" | "image" | "video" | "file";
}

export const sendMessage = async (data: SendMessageData) => {
  const { senderId, receiverId, message, messageType = "text" } = data;

  // 1️⃣ Find or create chat
  let chat = await Chat.findOne({
    include: [
      {
        model: User,
        as: "participants",
        where: { id: [senderId, receiverId] }, // both participants
      },
    ],
  });

  if (!chat) {
    chat = await Chat.create();
    await chat.addParticipants([senderId, receiverId]);
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message,
    messageType,
    isRead: false,
  });

  // 3️⃣ Update lastMessage in chat
  await Chat.update(
    { lastMessageId: newMessage.id },
    { where: { id: chat.id } }
  );

  return { ...newMessage?.dataValues };
};
export const getChatBetweenUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.params;
    const myId = req.user?.id;
    console.log("My ID:", myId, "Receiver ID:", receiverId);

    if (!myId) return res.status(401).json({ message: "Unauthorized" });

    // 1️⃣ Find chat that has both users as participants
    const chat = await Chat.findOne({
      include: [
        {
          model: User,
          as: "participants",
          where: { id: { [Op.in]: [myId, receiverId] } },
          attributes: { exclude: ["password"] },
          through: { attributes: [] }, // don't include junction table
        },
        {
          model: Message,
          as: "lastMessage",
        },
      ],
    });

    if (!chat)
      return res.status(404).json({ message: "No chat found", status: false });

    // 2️⃣ Fetch all messages between the two users
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: receiverId },
          { senderId: receiverId, receiverId: myId },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    return res
      .status(200)
      .json({
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
export const changeMeesageReadeStatus = async (
  req: AuthRequest,
  res: Response
) => {
  const { receiverId } = req.params;
  const myId = req.user?.id;
  try {
    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          senderId: Number(myId),
          receiverId: Number(receiverId),
          isRead: false,
        },
      }
    );

    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to mark messages as read" });
  }
};
