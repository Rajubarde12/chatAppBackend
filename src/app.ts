import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import chatRoutes from "./routes/chat.routes";
import uploadRoute from './routes/upload.routes'
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/users/chats", chatRoutes);
app.use("/api/users/mediaUpload", uploadRoute);

export default app;
