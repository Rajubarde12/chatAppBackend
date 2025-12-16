import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

interface CustomRequest extends Request {
  body: {
    uploadType?: "profile" | "chat" | "attachment";
    chatId?: string;
  };
}

// Helper: ensure folder exists
const ensureDirExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Define storage
const storage = multer.diskStorage({
  destination: (req: CustomRequest, file, cb) => {
    const { uploadType, chatId } = req.body;
    let folderPath = "uploads/";

    // 📁 Define by upload type

    // Identify attachment type by MIME
    if (file.mimetype.startsWith("image/")) {
      folderPath = "uploads/attachments/images";
    } else if (file.mimetype.startsWith("video/")) {
      folderPath = "uploads/attachments/videos";
    } else {
      folderPath = "uploads/attachments/files";
    }

    // 🧱 Ensure path exists
    ensureDirExists(folderPath);

    cb(null, folderPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeName = base.replace(/\s+/g, "_"); // remove spaces
    const uniqueName = `${Date.now()}_${safeName}${ext}`;
    cb(null, uniqueName);
  },
});

// 🧩 File type validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  cb(null, true);
};

// 🚀 Export upload middleware
export const attachmentsUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});
