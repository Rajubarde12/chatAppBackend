import express from "express";
import { blockUser, getAdminComplaintList, handleComplaint, unBlockUser } from "../controllers/adminController";
import { protect } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/block/:userId",blockUser);  
router.post("/unblock/:userId",unBlockUser);  
router.get("/getAllCompaints",getAdminComplaintList);  
router.post("/reviewComplaint/:complaintId",handleComplaint);  
export default router;      