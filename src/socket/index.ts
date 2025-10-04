import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Chat from "../models/Chat";
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Authentication error: Invalid user"));

      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log("⚡ Authenticated user connected:", user._id);

    // Join personal room (userId based)
    socket.join(user._id.toString());

    // 🟢 Send message
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, receiverId, message, messageType } = data;

        // 1️⃣ Save message to DB
        const newMessage = await Message.create({
          chatId,
          sender: user._id,
          receiver: receiverId,
          message,
          messageType: messageType || "text",
        });

        // 2️⃣ Update lastMessage in Chat
        await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

        // 3️⃣ Emit message to receiver
        io.to(receiverId).emit("newMessage", newMessage);

        // 4️⃣ Emit ack to sender
        socket.emit("messageSent", newMessage);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", user._id);
    });
  });
};
