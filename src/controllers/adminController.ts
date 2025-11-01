import { Response, Request } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  BlockedUser,
  BlockedUserComplaint,
  FailedLoginAttempt,
} from "../models";
import { User } from "../models";
import { Complaint } from "../models";
import {Warning} from "../models";
import { SuspiciousActivity } from "../models";
import { getAllCompaintsbyuserId } from "../helper/adminHelper";
import sequelize from "../config/db";
import { count } from "console";
import { getUserListWithLastMessage } from "./common";
import { Op } from "sequelize";
import generateToken from "../utils/generateToken";

export const loginAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const adminKey = req.headers.authorization;

    const user = await User.findOne({ where: { email } });
    if (user?.role != "admin" && user?.role != "SuperAdmin") {
      res.status(401).json({
        message: "You are not autorized for login",
        status: false,
      });
    }
    if (user?.role != "admin" && adminKey != process.env.ADMIN_SECURITY_KEY) {
      res.status(401).json({
        message: "You are not autorized for login",
        status: false,
      });
      return;
    }

    if (!user) {
      res
        .status(401)
        .json({ message: "Invalid email or password", status: false });
      return;
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res
        .status(401)
        .json({ message: "Invalid email or password", status: false });
      return;
    }
    if (user.avatar) {
      const BASE_URL = `${req.protocol}://${req.get("host")}`;
      user.avatar = `${BASE_URL}/${user.avatar}`;
    }
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    res.json({
      status: true,
      message: "User logged in successfully",
      token: generateToken(user.id.toString()),
      user: userData,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Complaint,
          as: "complaintsAgainst",
          include: [
            {
              model: User,
              as: "reporter",
              attributes: ["id", "name", "email"],
            },
            {
              model: User,
              as: "handledByAdmin",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: SuspiciousActivity,
          as: "activities",
          include: [
            {
              model: User,
              as: "handledByAdmin",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: BlockedUser,
          as: "blockRecords",
        },
        {
          model: Warning,
          as: "warnings",
          include: [
            {
              model: User,
              as: "adminUser",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: FailedLoginAttempt,
          as: "failedAttempts",
          attributes: ["id", "ipAddress", "userAgent", "createdAt"],
        },
      ],

      // 👇 Main fix: order by createdAt DESC for each association
      order: [
        [{ model: Complaint, as: "complaintsAgainst" }, "createdAt", "DESC"],
        [{ model: SuspiciousActivity, as: "activities" }, "createdAt", "DESC"],
        [{ model: BlockedUser, as: "blockRecords" }, "createdAt", "DESC"],
        [{ model: Warning, as: "warnings" }, "createdAt", "DESC"],
        [
          { model: FailedLoginAttempt, as: "failedAttempts" },
          "createdAt",
          "DESC",
        ],
      ],
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    if (user.avatar) {
      const BASE_URL = `${req.protocol}://${req.get("host")}`;
      user.avatar = `${BASE_URL}/${user.avatar}`;
    }

    res.json({
      status: true,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (err) {
    console.error("❌ getUserDetails error:", err);
    res.status(500).json({ status: false, message: "Server error" });
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
  const { unblockedReason } = req.body || {};
  if (!unblockedReason) {
    res.status(400).json({
      status: false,
      message: "unblockedReason is required",
    });
    return;
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
        .json({ status: false, message: "Block record not found" });
    }

    const userToUnblock = await User.findByPk(userId);
    if (userToUnblock) {
      userToUnblock.isDisabled = false;
      await userToUnblock.save();
    }

    blockRecord.unblockedAt = new Date();
    blockRecord.unblockedBy = admin.id;
    blockRecord.isBlocked = false;
    blockRecord.unblockedReason = unblockedReason;
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
        { model: User, as: "handledByAdmin", attributes: ["id", "name"] },
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
    // Step 1: Get the complaint
    const mainComplaint = await Complaint.findByPk(complaintId, {
      transaction: t,
    });
    if (!mainComplaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    if (mainComplaint.status !== "pending") {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Complaint already handled" });
    }

    const reportedUserId = mainComplaint.reportedUserId;

    // Step 2: Apply logic based on action
    if (action === "warn") {
      // 🔸 Create warning
      await Warning.create(
        {
          userId: reportedUserId,
          adminId,
          message:
            warningMessage ??
            `You received a warning for complaint: "${mainComplaint.reason}"`,
          type: "warning",
          readStatus: false,
          complaintId: mainComplaint.id,
        },
        { transaction: t }
      );

      // 🔸 Update all pending complaints for this user
      await Complaint.update(
        {
          status: "reviewed",
          handledBy: adminId,
          actionTaken: "Warning issued",
        },
        { where: { reportedUserId, status: "pending" }, transaction: t }
      );
    } else if (action === "block") {
      // 🔸 Block the user
      const blockedUser = await BlockedUser.create(
        {
          userId: reportedUserId,
          blockedBy: adminId,
          reason: mainComplaint.reason,
          reasonCategory: blockReasonCategory ?? mainComplaint.category,
          isBlocked: true,
          actionTaken: "temporaryBan",
          blockedAt: new Date(),
        },
        { transaction: t }
      );

      // Disable user
      const user = await User.findByPk(reportedUserId, { transaction: t });
      if (user) {
        user.isDisabled = true;
        await user.save({ transaction: t });
      }

      // Link all complaints
      const allPending = await Complaint.findAll({
        where: { reportedUserId, status: "pending" },
        transaction: t,
      });

      await BlockedUserComplaint.bulkCreate(
        allPending.map((c) => ({
          blockedUserId: blockedUser.id,
          complaintId: c.id,
        })),
        { transaction: t }
      );

      await Complaint.update(
        {
          status: "actionTaken",
          handledBy: adminId,
          actionTaken: "Blocked",
        },
        { where: { reportedUserId, status: "pending" }, transaction: t }
      );
    } else if (action === "dismiss") {
      // 🔸 Only dismiss THIS complaint
      mainComplaint.status = "dismissed";
      mainComplaint.actionTaken = "No action";
      mainComplaint.handledBy = adminId;
      await mainComplaint.save({ transaction: t });
    } else {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message:
        action === "dismiss"
          ? "Complaint dismissed successfully"
          : "All complaints handled successfully",
      userId: reportedUserId,
      action,
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

export const getllCounts = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    let wherClose = { role: "user" } as any;
    if (user?.role == "SuperAdmin") {
      wherClose.role = {
        [Op.ne]: "SuperAdmin",
      };
    }

    const users = await User.count({ where: wherClose });
    const complaints = await Complaint.count();
    const warnings = await Warning.count();
    const blocked = await BlockedUser.count();
    return res.status(200).json({
      message: "Counts",
      status: true,
      data: {
        users,
        complaints,
        warnings,
        blocked,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internam server error",
    });
  }
};

export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const role = req.user?.role;
    const users = await getUserListWithLastMessage(currentUserId, false, role);
    res.status(200).json({ data: { users }, status: true, message: "success" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong!", status: false });
  }
};
