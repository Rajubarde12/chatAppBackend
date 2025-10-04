import app from "./app";
import connectDB from "./config/db";
import { initSocket } from "./socket";
import http from "http";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Connect DB then start server
connectDB().then(() => {
  initSocket(server); // initialize socket
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
