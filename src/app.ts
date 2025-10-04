import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import chatRoutes from "./routes/chat.routes";

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

export default app;
