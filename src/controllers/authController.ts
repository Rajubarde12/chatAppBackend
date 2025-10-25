import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { log } from "console";
import { Op } from "sequelize";
import { getUserListWithLastMessage } from "./common";
import { BlockedUser, FailedLoginAttempt, SuspiciousActivity } from "../models";

// Register
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const adminKey = req.headers.authorization;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400).json({ message: "User already exists", status: false });
      return;
    }
    if (!name || !email || !password) {
      res
        .status(442)
        .json({ message: "All Fields are required", status: false });
      return;
    }
    if (role == "admin" && adminKey != process.env.ADMIN_SECURITY_KEY) {
      res
        .status(401)
        .json({ message: "You can not egibile for this role", status: false });
      return;
    }
    const user = await User.create({
      name,
      email,
      password: password,
      role: role ?? "user",
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id.toString()),
      status: true,
      message: "User registered successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message, status: false });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const adminKey = req.headers.authorization;

    const user = await User.findOne({ where: { email } });
    if (user?.role == "admin" && adminKey != process.env.ADMIN_SECURITY_KEY) {
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
    if (user.isDisabled) {
      // Check if disabled due to suspicious activity
      const suspiciousActivity = await SuspiciousActivity.findOne({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]],
      });

      if (suspiciousActivity) {
        const type = suspiciousActivity.type;
        switch (type) {
          case "loginAnomaly":
            res.status(403).json({
              message:
                "Your account has been temporarily locked due to multiple failed login attempts.",
              reason:
                "Too many incorrect password attempts detected. Please try again later.",
              status: false,
            });
            return;

          case "massReports":
            res.status(403).json({
              message:
                "Your account is under review due to multiple reports from users.",
              reason:
                "Mass user reports detected. Please wait for admin review.",
              status: false,
            });
            return;

          case "spam":
            res.status(403).json({
              message:
                "Your account has been temporarily restricted for suspicious messaging activity.",
              reason: "Possible spam or automated behavior detected.",
              status: false,
            });
            return;

          default:
            res.status(403).json({
              message:
                "Your account is temporarily restricted due to suspicious activity.",
              reason: "Please contact support or wait for admin review.",
              status: false,
            });
            return;
        }
      }

      // Otherwise check if blocked manually by admin
      const blockedRecord = await BlockedUser.findOne({
        where: { userId: user.id, isBlocked: true },
        order: [["blockedAt", "DESC"]],
        attributes: ["reason", "reasonCategory", "actionTaken", "blockedAt"],
      });

      if (blockedRecord) {
        res.status(403).json({
          message: "You are blocked by admin.",
          reason: blockedRecord.reason,
          category: blockedRecord.reasonCategory,
          actionTaken: blockedRecord.actionTaken,
          blockedAt: blockedRecord.blockedAt,
          status: false,
        });
        return;
      }

      // Fallback: Generic block message
      res.status(403).json({
        message: "Your account is currently disabled.",
        reason: "Please contact support for further details.",
        status: false,
      });
      return;
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      FailedLoginAttempt.create({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const failedCount = await FailedLoginAttempt.count({
        where: {
          userId: user.id,
          createdAt: { [Op.gte]: tenMinutesAgo },
        },
      });
      if (failedCount >= 5) {
        // Mark suspicious activity
        await SuspiciousActivity.create({
          userId: user.id,
          type: "loginAnomaly",
          details: JSON.stringify({ failedCount, period: "10min" }),
          status: "actionTaken",
        });
        user.isDisabled = true;
        await user.save();
        res.status(403).json({
          message:
            "Multiple failed login attempts detected. Account temporarily locked.",
          status: false,
        });
        return;
      }

      res
        .status(401)
        .json({ message: "Invalid email or password", status: false });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id.toString()),
      status: true,
      message: "User logged in successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const userProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { user } = req;
    if (!user) {
      res.status(404).json({ message: "No user found!", status: false });
      return;
    }
    res.status(200).json({
      message: "success",
      status: true,
      user,
    });
  } catch (err) {
    console.log("ths is error", err);

    res.status(500).json({ message: "Something went wrong!", status: false });
  }
};
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const users = await getUserListWithLastMessage(currentUserId);

    // const users = await User.findAll({
    //   where: {
    //     id: { [Op.ne]: currentUserId }, // exclude current user
    //   },
    //   attributes: { exclude: ["password"] }, // don't return password
    // });

    res.status(200).json({ users, status: true, message: "success" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong!", status: false });
  }
};

export const checkUserOnline = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ["isActive", "lastLogin"],
    });
    if (!user) {
      res.status(404).json({
        message: "No User Found",
        status: false,
      });
      return;
    }
    res.status(200).json({
      message: "User active status fetched successfully",
      data: user,
      status: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { oldPassword, newPassword } = req.body;
    console.log(req.body);

    if (!user) {
      res.status(404).json({ message: "No user found!", status: false });
      return;
    }

    // Check if old password matches
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      res
        .status(400)
        .json({ message: "Old password is incorrect", status: false });
      return;
    }

    // Update to new password
    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ message: "Password updated successfully", status: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong!", status: false });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { name, email, avatar, bio } = req.body;

    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      status: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong!", status: false });
  }
};
