import express from "express";
import { registerUser, loginUser,userProfile,getUsers, checkUserOnline,updatePassword, updateUserProfile,detectCountryAndPhoneMeta } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { detectCountryCode } from "../middleware/countryCodeMiddleware";

const router = express.Router();

router.get('/detectCountryAndPhoneMeta',detectCountryAndPhoneMeta)
router.post("/register",detectCountryCode, registerUser);
router.post("/login", loginUser);
router.get('/profile',protect,userProfile)
router.get('/list',protect,getUsers)
router.post("/changePassword",protect,updatePassword)
router.get('/userStatus/:userId',protect,checkUserOnline)
router.post('/profile/update',protect,updateUserProfile)

export default router;
