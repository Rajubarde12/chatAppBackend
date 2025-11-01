import { Op } from "sequelize";
import { User } from "../models";
import {Message} from "../models";

export const getUserListWithLastMessage = async (
  currentUserId?: string,
  withMessage: boolean = false,
  role?: string
) => {
  // 1️⃣ Get all users except current user

  let wherClose = { id: { [Op.ne]: currentUserId }, role: "user" } as any;
  if (role == "SuperAdmin") {
    wherClose = {
      id: { [Op.ne]: currentUserId },
    };
  }

  const users = await User.findAll({
    where: wherClose,
    attributes: { exclude: ["password"] },
    raw: true,
  });

  // 2️⃣ If withMessage is false → return plain users
  if (!withMessage) return users;

  // 3️⃣ Otherwise include lastMessage + unreadCount
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

  // 4️⃣ Sort users by latest message time (descending)
  result.sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });

  return result;
};
