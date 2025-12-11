import express from "express";
import { userProfile,getUsers, checkUserOnline, updateUserProfile,detectCountryAndPhoneMeta, sendOtp, verifyOtp, uploadProfimeImageContorller } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { detectCountryCode } from "../middleware/countryCodeMiddleware";
import { uploadProfileImage } from "../middleware/profileUpload";

const router = express.Router();
router.get('/detectCountryAndPhoneMeta',detectCountryAndPhoneMeta)
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get('/profile',protect,userProfile)
router.get('/list',protect,getUsers)
router.get('/userStatus/:userId',protect,checkUserOnline)
router.post('/profile/update',protect,updateUserProfile)
router.post('/profile/updateImage',protect,uploadProfileImage,uploadProfimeImageContorller)

export default router;
