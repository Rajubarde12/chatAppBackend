import express from "express";
import { blockUser, getAdminComplaintList, getAllSuspisousActivity, getComplaintsByUser, getllCounts, getUser, getUsers, handleComplaint, handleMultipleComplaint, takeActionSuspiciousActivity, unBlockUser, updateSuspiciousStatus } from "../controllers/adminController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();
router.get('/counts',getllCounts)
router.post("/block/:userId",blockUser);  
router.get("/getUser/:userId",getUser);  
router.get('/users',getUsers)
router.post("/unblock/:userId",unBlockUser);  
router.get("/getAllCompaints",getAdminComplaintList);  
router.get("/getAllCompaints/:status",getAdminComplaintList);  
router.post("/reviewComplaint/:complaintId",handleComplaint);  
router.post("/handleMultiplecomplaint/:userId",handleMultipleComplaint);  
router.get("/getAllSuspisiousActivity",getAllSuspisousActivity);  
router.get("/getComplaintbyRepordeduser",getComplaintsByUser);  
router.get("/takeActionSuspisiousActivity/:Suspiciousid",takeActionSuspiciousActivity);  
router.post("/updateSuspisiousActivity/:Suspiciousid",updateSuspiciousStatus);  
export default router;      