import express, { Request, Response } from "express";
import { upload } from "../middleware/upload";

const router = express.Router();

// 🧑 Upload profile picture
router.post("/profile", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`;
  res.json({
    message: "Profile uploaded successfully",
    fileUrl,
  });
});

// 💬 Upload chat attachment
router.post("/chat", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { chatId } = req.body;
  const fileUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`;

  res.json({
    message: "Chat file uploaded successfully",
    chatId,
    fileUrl,
  });
});

export default router;
