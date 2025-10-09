import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendMessage } from "../controllers/chatController";

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
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error("Authentication error: Invalid user"));

      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log("⚡ Authenticated user connected:", user.id);
    onlineUsers[user.id] = socket.id;
    io.emit("userStatusChanged", { userId: user.id, status: "online" });

    // Join personal room (userId based)
    socket.join(user.id.toString());

    // 🟢 Send message
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, receiverId, message, messageType } = data;
        const newMessage = await sendMessage({
          senderId: Number(user.id),
          receiverId: Number(receiverId),
          message,
          messageType: messageType || "text",
        });
   console.log("New message:", newMessage); // Debugging line
      
        io.to(receiverId.toString()).emit("newMessage", newMessage);

        // 4️⃣ Emit ack to sender
        socket.emit("messageSent", newMessage);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", user.id);
      delete onlineUsers[user.id];
      io.emit("userStatusChanged", { userId: user.id, status: "offline" });
    });
  });
};

const onlineUsers: Record<string, string> = {};
