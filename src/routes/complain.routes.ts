import express  from "express";
import { protect } from "../middleware/authMiddleware";
import { addComplaint } from "../controllers/complaintControllers";
const router=express.Router();
 router.post('/add',addComplaint)

export default router