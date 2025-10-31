import { Response } from "express";
import { AuthRequest } from "../middleware/adminauthMiddleWare";
import {
  BlockedUser,
  Complaint,
  SuspiciousActivity,
  User,
  Warning,
} from "../models";

export const getAdminActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Complaints handled by this admin
    const handledComplaints = await Complaint.findAll({
      where: { handledBy: userId },
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "reportedUser", attributes: ["id", "name", "email"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    // 2️⃣ Suspicious activities handled by this admin
    const handledSuspicious = await SuspiciousActivity.findAll({
      where: { handledBy: userId },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    // 3️⃣ Users blocked/unblocked by this admin
    const blockedActions = await BlockedUser.findAll({
      where: {
        // admin could have blocked or unblocked a user
      },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: User, as: "blockedByAdmin", attributes: ["id", "name", "email"] },
        { model: User, as: "unblockedByAdmin", attributes: ["id", "name", "email"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    // Filter only where this admin acted
    const adminBlockedActions = blockedActions.filter(
      (b: any) => b.blockedBy === userId || b.unblockedBy === userId
    );

    // 4️⃣ Warnings issued by this admin
    const issuedWarnings = await Warning.findAll({
      where: { adminId: userId },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Complaint, as: "complaint" },
      ],
      order: [["updatedAt", "DESC"]],
    });

    // ✅ Combine all handled activities
    const adminActivities = {
      complaintsHandled: handledComplaints,
      suspiciousHandled: handledSuspicious,
      blockUnblockActions: adminBlockedActions,
      warningsIssued: issuedWarnings,
    };

    res.status(200).json({
      status: true,
      message: "Admin handled activities fetched successfully",
      data: adminActivities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};
