import express, { Request, Response } from "express";
import { upload } from "../middleware/upload";
import { AuthRequest, protect } from "../middleware/authMiddleware";
import { User } from "../models";
import { attachmentsUpload } from "../middleware/attachmentsUpload";

const router = express.Router();

// 🧑 Upload profile picture
router.post(
  "/profile",
  protect,
  upload.single("file"),
  (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`;
    User.update(
      {
        avatar: req.file.path,
      },
      {
        where: { id: req.user?.id },
      }
    );
    res.json({
      message: "Profile uploaded successfully",
      fileUrl,
    });
  }
);

router.post(
  "/chat",
  protect,
  attachmentsUpload.single("file"),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { chatId } = req.body;
    const fileUrl = `${req.file.path}`;

    res.json({
      message: "Chat file uploaded successfully",
      chatId,
      fileUrl,
    });
  }
);

export default router;
