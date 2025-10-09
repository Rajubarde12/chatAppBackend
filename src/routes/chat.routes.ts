import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  changeMeesageReadeStatus,
  getChatBetweenUsers,
  
} from "../controllers/chatController";

const router = express.Router();
router.get("/get/:receiverId", protect, getChatBetweenUsers);         
router.get("/readeStatus/:receiverId", protect, changeMeesageReadeStatus);         


export default router;
