import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Extend Request to include custom body fields
interface CustomRequest extends Request {
  body: {
    uploadType?: "profile" | "chat";
    chatId?: string;
  };
}

// Define storage engine
const storage = multer.diskStorage({
  destination: (req: CustomRequest, file, cb) => {
    const { uploadType, chatId } = req.body;
    let folderPath = "uploads/";

    if (uploadType === "profile") {
      folderPath = "uploads/profiles";
    } else if (uploadType === "chat" && chatId) {
      folderPath = `uploads/chats/${chatId}`;
    }

    // Make sure the folder exists
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});


// Optional file filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
});
