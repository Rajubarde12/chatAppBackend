import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import {User} from "../models";
import {
  makeMarkeAsReadMessage,
  sendMessage,
} from "../controllers/chatController";
import Message from "../models/Message";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // 🔑 Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };
      // const user = await User.findById(decoded.id).select("-password");
      const user = await User.findByPk(decoded.id,{attributes: { exclude: ["password",] }});
      if (!user) return next(new Error("Authentication error: Invalid user"));

      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const user = (socket as any).user;
    onlineUsers[user.id] = socket.id;

    await User.update(
      { isActive: true, lastLogin: undefined },
      { where: { id: user.id } }
    );
    io.emit("userStatusChanged", { userId: user.id, isActive: true });
    await Message.update(
      { isDelivered: true },
      {
        where: {
          receiverId: user.id,
        },
      }
    );
    socket.join(user.id.toString());

    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, receiverId, message, messageType } = data;
        const newMessage = await sendMessage({
          senderId: user.id,
          receiverId: receiverId,
          message,
          messageType: messageType || "text",
          isOnline: onlineUsers[receiverId] ? true : false,
        });

        io.to(receiverId.toString()).emit("newMessage", newMessage);

        // 4️⃣ Emit ack to sender
        socket.emit("messageSent", newMessage);
        socket.to(receiverId.toString()).emit("pushNotification", { newMessage, User: user });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });
    socket.on("readMessage", async (data) => {
      const userId = user.id;
      const { receiverId } = data;
      console.log(userId,receiverId);
      
      const messageIds = await makeMarkeAsReadMessage(receiverId, userId); 
      io.to(receiverId.toString()).emit("readMessagesid", messageIds);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log("❌ User disconnected:", user.id);
      delete onlineUsers[user.id];
      await User.update(
        { isActive: false, lastLogin: new Date() },
        { where: { id: user.id } }
      );
      io.emit("userStatusChanged", {
        userId: user.id,
        isActive: false,
        lastLogin: new Date(),
      });
    });
  });
};

const onlineUsers: Record<string, string> = {};
