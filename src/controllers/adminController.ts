import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { BlockedUser, BlockedUserComplaint } from "../models";
import { User } from "../models";
import { Complaint } from "../models";
import Warning from "../models/Warning";
import { SuspiciousActivity } from "../models";
import { getAllCompaintsbyuserId } from "../helper/adminHelper";

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { user: admin } = req;
    if (!admin) {
      res.status(404).json({
        message: "You are not eliginble to show the detials",
        status: false,
      });
      return;
    }
    const { userId } = req.params || {};

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
      return res.status(404).json({
        message: "User not found with this user id",
        status: false,
      });
    }
    return res.status(200).json({
      message: "Data of the user",
      status: true,
      data: {
        user,
      },
    });
  } catch (errr) {
    res.status(500).json({
      message: "something went wrong",
      status: false,
    });
  }
};
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
    const { status } = req.params || {};
    let whereCondition = {} as {
      status: string;
    };
    if (status) {
      whereCondition.status = status;
    }

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
      where: whereCondition,
    });
if (!complaints || complaints.length === 0) {
  return res.json({
    success: false,
    complaints,
    message: `No${status ? ` ${status}` : ""} complaints found.`,
  });
}
    res.json({
      message: `Found ${complaints.length} ${status ? `${status} ` : ""}complaint${complaints.length !== 1 ? "s" : ""}.`,
      success: true,
      complaints,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error", error: err, status: false });
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
      return res
        .status(404)
        .json({ message: "Complaint not found", status: false });
    }
    if (complaint.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Complaint already handled", status: false });
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
      user?.save();
      await BlockedUserComplaint.create({
        blockedUserId: blockedUser.id,
        complaintId: complaint.id,
      });
    } else if (action === "dismiss") {
      complaint.status = "dismissed";
      complaint.actionTaken = "No action";
    } else {
      return res.status(400).json({ message: "Invalid action", status: false });
    }

    // Save complaint updates
    await complaint.save();

    res.json({ message: "Complaint handled successfully", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getAllSuspisousActivity = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const data = await SuspiciousActivity.findAll();

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "No data found",
      });
    }
    return res.status(200).json({
      message: "SuspiciousActivities found",
      data,
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",

      status: false,
    });
  }
};

export const getComplaintsByUser = async (req: AuthRequest, res: Response) => {
  const { reportedUserId,last24hours } = req.params;
  if (!reportedUserId) {
    res.status(400).json({
      message: "reportedUserId is required",
      status: false,
    });
  }

  try {
    const complaints = await getAllCompaintsbyuserId(reportedUserId);
    if (complaints.length <= 0) {
      return res.status(404).json({
        message: "No Compaints found for this user",
        status: false,
      });
    }

    res.json({
      last24hours,
      status: true,
      message: "Complaints against this user",
      complaints,
      
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error", error: err, status: false });
  }
};

export const takeActionSuspiciousActivity = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { user: admin } = req;
    const { Suspiciousid } = req.params;

    // Validate admin
    if (!admin?.id) {
      return res.status(400).json({
        status: false,
        message: "You cannot process this.",
      });
    }

    // Validate ID
    if (!Suspiciousid) {
      return res.status(400).json({
        status: false,
        message: "Suspicious ID is required.",
      });
    }

    // Fetch suspicious activity
    const suspicious = await SuspiciousActivity.findByPk(Suspiciousid);
    if (!suspicious) {
      return res.status(404).json({
        message: "No suspicious activity found.",
        status: false,
      });
    }

    // If it's a mass report type
    if (suspicious.type === "massReports") {
      const suspiciousUserId = suspicious.userId;

      // Fetch all complaints by that user
      const complaints = await getAllCompaintsbyuserId(suspiciousUserId);

      return res.status(200).json({
        message:
          "There are multiple complaints against this user. Please review carefully.",
        status: true,
        data: {
          suspicious,
          complaints,
        },
      });
    }

    // Default case
    return res.status(404).json({
      message: "No actionable data found.",
      status: false,
    });
  } catch (error) {
    console.error("Error in takeActionSuspiciousActivity:", error);
    res.status(500).json({
      message: "Internal server error.",
      status: false,
    });
  }
};
export const updateSuspiciousStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { user: admin } = req;
    const { Suspiciousid } = req.params;
    const { action } = req.body;
    // Validate admin
    if (!admin?.id) {
      return res.status(400).json({
        status: false,
        message: "You cannot process this.",
      });
    }

    // Validate ID
    if (!Suspiciousid) {
      return res.status(400).json({
        status: false,
        message: "Suspicious ID is required.",
      });
    }

    // Fetch suspicious activity
    const suspicious = await SuspiciousActivity.findByPk(Suspiciousid);
    if (!suspicious) {
      return res.status(404).json({
        message: "No suspicious activity found.",
        status: false,
      });
    }

    if (suspicious.type == "massReports") {
      switch (action) {
        case "parmanentBlocked": {
          await SuspiciousActivity.update(
            { status: "actionTaken", handledBy: admin.id },
            {
              where: {
                id: Suspiciousid,
              },
            }
          );
          await Complaint.update(
            { actionTaken: "Permantly blocked", status: "actionTaken" },
            { where: { reportedUserId: suspicious.userId, status: "pending" } }
          );

          const blockedUser = await BlockedUser.create({
            userId: suspicious.userId,
            blockedBy: admin.id,
            reason:
              "You are permanetly blocked becuase many users reported you",
            reasonCategory: "scam",
            isBlocked: true,
            actionTaken: "permanentBan",
            blockedAt: new Date(),
          });
          const user = await User.findByPk(suspicious.userId, {
            attributes: { exclude: ["password"] },
          });

          user!.isDisabled = true;
          user?.save();
          return res.status(201).json({
            status: true,
            message: "Handled this gggg",
          });
        }
        default: {
          await SuspiciousActivity.update(
            { status: "reviewed", handledBy: admin.id },
            {
              where: {
                id: Suspiciousid,
              },
            }
          );
          await Complaint.update(
            {
              actionTaken: "Warned this user",
              status: "reviewed",
              handledBy: admin.id,
            },
            { where: { reportedUserId: suspicious.userId, status: "pending" } }
          );

          await Warning.create({
            userId: suspicious.userId,
            adminId: admin?.id,
            message: `Multpile user repoting on please be carefull for `,
            type: "warning",
            readStatus: false,
          });
        }
      }
      return res.status(201).json({
        status: true,
        message: "Handled this activity",
      });
    }

    return res.status(404).json({
      message: "No actionable data found.",
      status: false,
    });
  } catch (error) {
    console.error("Error in takeActionSuspiciousActivity:", error);
    res.status(500).json({
      message: "Internal server error.",
      status: false,
    });
  }
};

