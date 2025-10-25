import { AuthRequest } from "../middleware/authMiddleware";
import {Complaint} from "../models";
import { Response } from "express";

export const addComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req; // Logged-in user
    const { reportedUserId, reason, category, evidence } = req.body||{};

    // 1️⃣ Validate input
    if (!reportedUserId || !reason) {
      return res.status(400).json({
        message: "reportedUserId and reason are required.",
        status:false
      });
    }
    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" ,status:false});
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
      status:true,
      complaint,

    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error while submitting complaint.",
      status:false
    });
  }
};
