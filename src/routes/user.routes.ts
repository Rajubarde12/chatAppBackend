import express from "express";
import { registerUser, loginUser,userProfile,getUsers } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);
router.get('/profile',protect,userProfile)
router.get('/users',protect,getUsers)

export default router;
