import { Op } from "sequelize";
import User from "../models/User";
import Message from "../models/Message";

export const getUserListWithLastMessage = async (currentUserId?: number) => {
  // 1️⃣ Get all users except current
  const users = await User.findAll({
    where: { id: { [Op.ne]: currentUserId } },
    attributes: { exclude: ["password"] },
    raw: true,
  });

  // 2️⃣ Add last message + unread count
  const result = await Promise.all(
    users.map(async (user) => {
      const lastMessage = await Message.findOne({
        where: {
          [Op.or]: [
            { senderId: currentUserId, receiverId: user.id },
            { senderId: user.id, receiverId: currentUserId },
          ],
        },
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      const unreadCount = await Message.count({
        where: {
          senderId: user.id,
          receiverId: currentUserId,
          isRead: false,
        },
      });

      return {
        ...user,
        lastMessage,
        unreadCount,
        lastMessageTime: lastMessage?.createdAt || null,
      };
    })
  );

  // 3️⃣ Sort users by latest message time (descending)
  result.sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });

  return result;
};
