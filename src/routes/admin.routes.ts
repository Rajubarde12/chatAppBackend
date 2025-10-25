import express from "express";
import { blockUser, unBlockUser } from "../controllers/adminController";
import { protect } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/block/:userId",blockUser);  
router.post("/unblock/:userId",unBlockUser);  
export default router;      