import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { BlockedUser, BlockedUserComplaint } from "../models";
import { User } from "../models";
import { Complaint } from "../models";
import Warning from "../models/Warning";
import { SuspiciousActivity } from "../models";
import { getAllCompaintsbyuserId } from "../helper/adminHelper";
import sequelize from "../config/db";

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { user: admin } = req;
    if (!admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access user details",
      });
    }

    const { userId } = req.params || {};
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this user id",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: { user },
    });
  } catch (err) {
    console.error("getUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  const { user: admin } = req;
  if (!admin?.id) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { userId } = req.params || {};
  const { reason, reasonCategory, actionTaken } = req.body || {};

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId is required" });
  }

  if (!reason) {
    return res
      .status(400)
      .json({ success: false, message: "reason is required" });
  }

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isDisabled) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "User is already blocked" });
    }

    // create block record
    const blockRecord = await BlockedUser.create(
      {
        reason,
        isBlocked: true,
        userId,
        blockedBy: admin.id,
        reasonCategory: reasonCategory ?? "spam",
        actionTaken: actionTaken ?? "temporaryBan",
        blockedAt: new Date(),
      },
      { transaction: t }
    );

    // disable user
    user.isDisabled = true;
    await user.save({ transaction: t });

    // commit
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: { blockRecord, user },
    });
  } catch (err) {
    console.error("blockUser error:", err);
    await t.rollback();
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const unBlockUser = async (req: AuthRequest, res: Response) => {
  const { user: admin } = req;
  if (!admin?.id) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { userId } = req.params;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId is required" });
  }

  try {
    const blockRecord = await BlockedUser.findOne({
      where: { userId, isBlocked: true },
      order: [["createdAt", "DESC"]],
    });

    if (!blockRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Block record not found" });
    }

    const userToUnblock = await User.findByPk(userId);
    if (userToUnblock) {
      userToUnblock.isDisabled = false;
      await userToUnblock.save();
    }

    blockRecord.unblockedAt = new Date();
    blockRecord.unblockedBy = admin.id;
    blockRecord.isBlocked = false;
    await blockRecord.save();

    return res
      .status(200)
      .json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("unBlockUser error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAdminComplaintList = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { status } = req.params || {};
    const whereCondition: any = {};
    if (status) whereCondition.status = status;

    const complaints = await Complaint.findAll({
      where: whereCondition,
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

    if (!complaints || complaints.length === 0) {
      return res.status(200).json({
        success: true,
        complaints: [],
        message: `No${status ? ` ${status}` : ""} complaints found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Found ${complaints.length} ${status ? `${status} ` : ""}complaint${complaints.length !== 1 ? "s" : ""}.`,
      complaints,
    });
  } catch (err) {
    console.error("getAdminComplaintList error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleComplaint = async (req: AuthRequest, res: Response) => {
  const { complaintId } = req.params;
  const { user: Admin } = req;
  if (!Admin?.id) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const adminId = Admin.id;
  const { action, warningMessage, blockReasonCategory } = req.body || {};

  if (!complaintId) {
    return res
      .status(400)
      .json({ success: false, message: "complaintId is required" });
  }

  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(complaintId, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }
    if (complaint.status !== "pending") {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Complaint already handled" });
    }

    complaint.handledBy = adminId;

    if (action === "warn") {
      complaint.status = "reviewed";
      complaint.actionTaken = "Warning issued";

      await Warning.create(
        {
          userId: complaint.reportedUserId,
          complaintId: complaint.id,
          adminId,
          message:
            warningMessage ??
            `You received a warning for complaint: "${complaint.reason}"`,
          type: "warning",
          readStatus: false,
        },
        { transaction: t }
      );
    } else if (action === "block") {
      complaint.status = "actionTaken";
      complaint.actionTaken = "Blocked";

      const blockedUser = await BlockedUser.create(
        {
          userId: complaint.reportedUserId,
          blockedBy: adminId,
          reason: complaint.reason,
          reasonCategory: blockReasonCategory ?? complaint.category,
          isBlocked: true,
          actionTaken: "temporaryBan",
          blockedAt: new Date(),
        },
        { transaction: t }
      );

      const user = await User.findByPk(complaint.reportedUserId, {
        transaction: t,
      });
      if (user) {
        user.isDisabled = true;
        await user.save({ transaction: t });
      }

      await BlockedUserComplaint.create(
        {
          blockedUserId: blockedUser.id,
          complaintId: complaint.id,
        },
        { transaction: t }
      );
    } else if (action === "dismiss") {
      complaint.status = "dismissed";
      complaint.actionTaken = "No action";
    } else {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await complaint.save({ transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint handled successfully",
      complaint,
    });
  } catch (err) {
    console.error("handleComplaint error:", err);
    await t.rollback();
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const handleMultipleComplaint = async (
  req: AuthRequest,
  res: Response
) => {
  const { userId } = req.params;
  const { user: Admin } = req;
  if (!Admin?.id) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const adminId = Admin.id;
  const { action, warningMessage, blockReasonCategory } = req.body || {};

  const t = await sequelize.transaction();
  try {
    let complaint = await Complaint.findAll({
      where: { reportedUserId: userId, status: "pending" },
      transaction: t,
    });
    if (complaint.length <= 0) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Complaint not found about this user",
      });
    }

    if (action === "warn") {
      await Warning.create(
        {
          userId: userId,

          adminId,
          message:
            warningMessage ??
            `We are warning you that there are multipe user warning you`,
          type: "warning",
          readStatus: false,
        },
        { transaction: t }
      );
      await Complaint.update(
        {
          status: "reviewed",
          handledBy: adminId,
          actionTaken: "Warning issued",
        },
        {
          where: {
            reportedUserId: userId,
            status: "pending",
          },
          transaction: t,
        }
      );
    } else if (action === "block") {
      await Complaint.update(
        {
          status: "actionTaken",
          handledBy: adminId,
          actionTaken: "Blocked",
        },
        {
          where: {
            reportedUserId: userId,
            status: "pending",
          },
          transaction: t,
        }
      );
      const blockedUser = await BlockedUser.create(
        {
          userId: userId,
          blockedBy: adminId,
          reason: "You are blockde becuase mutliple users waned you",
          reasonCategory: blockReasonCategory,
          isBlocked: true,
          actionTaken: "permanentBan",
          blockedAt: new Date(),
        },
        { transaction: t }
      );

      const user = await User.findByPk(userId, {
        transaction: t,
      });
      if (user) {
        user.isDisabled = true;
        await user.save({ transaction: t });
      }
    } else if (action === "dismiss") {
      await Complaint.update(
        {
          status: "dismissed",
          handledBy: adminId,
          actionTaken: "no action taken",
        },
        {
          where: {
            reportedUserId: userId,
            status: "pending",
          },
          transaction: t,
        }
      );
    } else {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint handled successfully",
      complaint,
    });
  } catch (err) {
    console.error("handleComplaint error:", err);
    await t.rollback();
    return res.status(500).json({ success: false, message: "Server error" });
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
  try {
    const { reportedUserId } = req.query;

    const last24hours = req.query.last24hours === "true";

    if (!reportedUserId) {
      return res
        .status(400)
        .json({ success: false, message: "reportedUserId is required" });
    }

    // pass the optional flag to helper
    const complaints = await getAllCompaintsbyuserId(
      String(reportedUserId),
      last24hours
    );

    if (!complaints || complaints.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No complaints found for this user",
        complaints: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaints against this user",
      complaints,
      meta: { count: complaints.length, last24hours },
    });
  } catch (err) {
    console.error("getComplaintsByUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
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
