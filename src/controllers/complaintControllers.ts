import { AuthRequest } from "../middleware/authMiddleware";
import { BlockedUser, Complaint } from "../models";
import { Response } from "express";

export const addComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req; // Logged-in user
    const { reportedUserId, reason, category, evidence } = req.body || {};
    if (user?.id == reportedUserId) {
      return res.status(404).json({
        message: "Khudko kaise block krega bsdk",
        status: false,
      });
    }

    // 1️⃣ Validate input
    if (!reportedUserId || !reason) {
      return res.status(400).json({
        message: "reportedUserId and reason are required.",
        status: false,
      });
    }

    const blockRecord = await BlockedUser.findOne({
      where: { userId: reportedUserId },
      order: [["createdAt", "DESC"]], // 👈 latest record first
    });

    if (
      blockRecord?.isBlocked 
    ) {
      return res.status(400).json({
        message:
          "Action already taken about this user no need to add complaint",
        status: false,
      });
    }

    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    // Optional: validate category
    const validCategories = [
      "spam",
      "harassment",
      "scam",
      "fakeProfile",
      "other",
    ];
    const complaintCategory = validCategories.includes(category)
      ? category
      : "other";

    // 2️⃣ Create complaint
    const complaint = await Complaint.create({
      reporterId: user?.id,
      reportedUserId,
      reason,
      category: complaintCategory,
      evidence: evidence || null,
      status: "pending",
    });

    // 3️⃣ Send response
    return res.status(201).json({
      message: "Complaint submitted successfully.",
      status: true,
      complaint,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error while submitting complaint.",
      status: false,
    });
  }
};
