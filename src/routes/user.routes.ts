import express from "express";
import { registerUser, loginUser,userProfile,getUsers, checkUserOnline,updatePassword, updateUserProfile } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);
router.get('/profile',protect,userProfile)
router.get('/list',protect,getUsers)
router.post("/changePassword",protect,updatePassword)
router.get('/userStatus/:userId',protect,checkUserOnline)
router.post('/profile/update',protect,updateUserProfile)

export default router;
