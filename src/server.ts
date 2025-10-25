import sequelize from "./config/db"; // your sequelize instance
import app from "./app";
import { initSocket } from "./socket";
import http from "http";
import dotenv from "dotenv";
import "./suspiciousCron"

dotenv.config();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected via Sequelize");

    // Sync all models
    await sequelize.sync(); // adds missing columns, keeps data
    console.log("✅ Database synced");

    initSocket(server); // initialize socket
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
  }
};

startServer();
