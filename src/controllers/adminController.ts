import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import BlockedUser from "../models/BlockedUsers";
import User from "../models/User";
import sequelize from "../config/db";
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
