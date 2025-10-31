import express from "express";
import { blockUser, getAdminComplaintList, getAllSuspisousActivity, getComplaintsByUser, getllCounts, getUser, getUsers, handleComplaint, handleMultipleComplaint, takeActionSuspiciousActivity, unBlockUser, updateSuspiciousStatus } from "../controllers/adminController";
import { protect } from "../middleware/authMiddleware";
import { superAdminMiddeleware } from "../middleware/superAdminMiddeleware";
import { getAdminActivities } from "../controllers/SuperAdminController";

const router = express.Router();
router.get('/counts',getllCounts)
router.post("/block/:userId",blockUser);  
router.get("/getUser/:userId",getUser);  
router.get('/users',getUsers)
router.put("/unblock/:userId",unBlockUser);  
router.get("/getAllCompaints",getAdminComplaintList);  
router.get("/getAllCompaints/:status",getAdminComplaintList);  
router.post("/reviewComplaint/:complaintId",handleComplaint);  
router.post("/handleMultiplecomplaint/:userId",handleMultipleComplaint);  
router.get("/getAllSuspisiousActivity",getAllSuspisousActivity);  
router.get("/getComplaintbyRepordeduser",getComplaintsByUser);  
router.get("/takeActionSuspisiousActivity/:Suspiciousid",takeActionSuspiciousActivity);  
router.post("/updateSuspisiousActivity/:Suspiciousid",updateSuspiciousStatus); 
//routrd wich are only accessible to super admin

router.get('/getUserActivity/:userId',superAdminMiddeleware,getAdminActivities)
 

export default router;      