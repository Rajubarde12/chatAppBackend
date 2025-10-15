import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";
import { Op } from "sequelize";

interface SendMessageData {
  senderId: string;
  receiverId: string;
  message: string;
  messageType?: "text" | "image" | "video" | "file";
  isOnline:true|false
}

export const sendMessage = async (data: SendMessageData) => {
  const { senderId, receiverId, message, messageType = "text",isOnline } = data;

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
    isDelivered:isOnline  
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
export const changeMeesageReadeStatus = async (
  req: AuthRequest,
  res: Response
) => {
  const { receiverId } = req.params;
  const myId = req.user?.id;

return res.send({
  status:null,
  message:"not worlong re"
})

  try {
    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          senderId: Number(receiverId),
          receiverId: Number(myId),
          isRead: false,
        },
      }
    );

    res.json({ status: true, updatedCount, message: "Updated read status" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: false, message: "Failed to mark messages as read" });
  }
};

export const makeMarkeAsReadMessage = async (
  senderId: number,
  receiverId: number
) => {
  const unreadMessages = await Message.findAll({
    where: {
      senderId,
      receiverId,
      isRead: false,
    },
    attributes: ["id"], // only select IDs
  });
  const updatedIds = unreadMessages.map((msg) => msg.id);
  if (updatedIds.length === 0) return [];
 await Message.update(
    { isRead: true },
    {
      where: { id: updatedIds },
    }
  );
  return updatedIds;
};
