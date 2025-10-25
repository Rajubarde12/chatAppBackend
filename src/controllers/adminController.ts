import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { BlockedUser, BlockedUserComplaint } from "../models";
import { User } from "../models";
import { Complaint } from "../models";
import Warning from "../models/Warning";
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { user: admin } = req;
    if (!admin) {
      res.status(404).json({
        message: "Your not elagible for update",
        status: false,
      });
      return;
    }
    const { userId } = req.params || {};
    const { reason, reasonCategory, actionTaken } = req.body;
    if (!reason) {
      res.status(404).json({
        message: "reason  is requried",
        status: false,
      });
      return;
    }

    if (!userId) {
      res.status(404).json({
        message: "user id is requried",
        status: false,
      });
      return;
    }
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      res.status(404).json({
        message: "user not found!",
        status: false,
      });
      return;
    }
    if (user?.isDisabled) {
      res.status(403).json({
        message: "User is Already Blocked",
        status: false,
      });
      return;
    }
    user.isDisabled = true;
    const bloceUse = await BlockedUser.create({
      reason,
      isBlocked: true,
      userId,
      blockedBy: admin.id,
      reasonCategory: reasonCategory ?? "spam",
      actionTaken,
    });
    await user.save();
    res.status(200).json({
      message: "user is blocked",
      reason: bloceUse.reason,
      user,
    });
  } catch (errr) {
    res.status(500).json({
      message: "something went wrong",
      status: false,
    });
  }
};
export const unBlockUser = async (req: AuthRequest, res: Response) => {
  const { user: admin } = req;
  const { userId } = req.params;
  try {
    const blockRecord = await BlockedUser.findOne({
      where: { userId, isBlocked: true },
      order: [["createdAt", "DESC"]],
    });
    if (!blockRecord) {
      res
        .status(404)
        .json({ message: "Block record not found", status: false });
      return;
    }
    const userToUnblock = await User.findByPk(userId);
    if (userToUnblock) {
      userToUnblock.isDisabled = false;
      await userToUnblock.save();
    }
    blockRecord.unblockedAt = new Date();
    blockRecord.unblockedBy = admin?.id;
    blockRecord.isBlocked = false;
    await blockRecord.save();
    // await blockRecord.destroy();
    res
      .status(200)
      .json({ message: "User unblocked successfully", status: true });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const getAdminComplaintList = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaints = await Complaint.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        {
          model: User,
          as: "reportedUser",
          attributes: ["id", "name", "email"],
        },
        { model: User, as: "adminUser", attributes: ["id", "name"] },
        {
          model: BlockedUser,
          as: "blockRecords",
          include: [
            { model: User, as: "blockedByAdmin", attributes: ["id", "name"] },
            { model: User, as: "unblockedByAdmin", attributes: ["id", "name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const handleComplaint = async (req: AuthRequest, res: Response) => {
  const { complaintId } = req.params;
  const { user: Admin } = req;
  if (!Admin?.id) {
    res.status(401).json({
      messag: "Not Autorized ",
      status: false,
    });
    return;
  }
  const adminId = Admin.id;
  const { action, warningMessage, blockReasonCategory } = req.body || {};


  try {
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    if (complaint.status !== "pending") {
      return res.status(400).json({ message: "Complaint already handled" });
    }

    // Update handledBy
    complaint.handledBy = adminId;

    if (action === "warn") {
      complaint.status = "reviewed";
      complaint.actionTaken = "Warning issued";

      // Create warning record
      await Warning.create({
        userId: complaint.reportedUserId,
        complaintId: complaint.id,
        adminId: adminId,
        message:
          warningMessage ||
          `You received a warning for complaint: "${complaint.reason}"`,
        type: "warning",
        readStatus: false,
      });
    } else if (action === "block") {
      complaint.status = "actionTaken";
      complaint.actionTaken = "Blocked";

      // Create block record
      const blockedUser = await BlockedUser.create({
        userId: complaint.reportedUserId,
        blockedBy: adminId,
        reason: complaint.reason,
        reasonCategory: complaint.category,
        isBlocked: true,
        actionTaken: "temporaryBan",
        blockedAt: new Date(),
      });
      const user = await User.findByPk(complaint.reportedUserId, {
        attributes: { exclude: ["password"] },
      });


        user!.isDisabled = true;
        user?.save()
      await BlockedUserComplaint.create({
        blockedUserId: blockedUser.id,
        complaintId: complaint.id,
      });
    } else if (action === "dismiss") {
      complaint.status = "dismissed";
      complaint.actionTaken = "No action";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    // Save complaint updates
    await complaint.save();

    res.json({ message: "Complaint handled successfully", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};
