import { Request, Response } from "express";
import { User } from "../models";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import countries from "i18n-iso-countries";
import { Op } from "sequelize";
import { getUserListWithLastMessage } from "./common";
import {
  BlockedUser,
  Complaint,
  FailedLoginAttempt,
  SuspiciousActivity,
} from "../models";
import { CountryCodeRequest } from "../middleware/countryCodeMiddleware";
import geoip from "geoip-lite";
import { CountryCode, getExampleNumber } from "libphonenumber-js";
const countryCodesList = require("country-codes-list");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
import examples from "libphonenumber-js/examples.mobile.json";
const callingCodes = countryCodesList.customList(
  "countryCode",
  "{countryCallingCode}"
);

export const detectCountryAndPhoneMeta = (req: Request, res: Response) => {
  try {
    let ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    if (ip === "::1" || ip.startsWith("127.") || ip.includes("192.168")) {
      const testCountryISO = "US"; // Change here for testing

      const testIPs: Record<string, string> = {
        IN: "49.207.180.1", // India
        US: "8.8.8.8", // USA
        GB: "81.2.69.142", // UK
        AU: "1.1.1.1", // Australia
        FR: "51.15.0.1", // France
        DE: "139.162.130.187", // Germany
        JP: "210.140.92.187", // Japan
        CN: "61.135.169.121", // China
        AE: "94.200.1.160", // UAE
      };

      ip = testIPs[testCountryISO] || testIPs["IN"];
    }

    const geo = geoip.lookup(ip);
    const countryISO = geo?.country || "IN";
    const callingCode = callingCodes[countryISO];
    const countryCode = callingCode ? `+${callingCode}` : "+91";
    const countryName = countries.getName(countryISO, "en") || "India";

    return res.status(200).json({
      message: "Country meta  get succcess",
      status: true,
      data: {
        countryCode,
        countryName,
        expectedExample: getExampleNumber(countryISO as CountryCode, examples),
      },
    });
  } catch (error) {
    res.send({
      status: false,
      message: "errroo",
    });
  }
};

export const registerUser = async (
  req: CountryCodeRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role, mobileNumber } = req.body;
    const conditions: any[] = [];
    const { countryCode, countryISO, countryName } = req;

    if (email) {
      conditions.push({ email });
    }

    if (mobileNumber) {
      conditions.push({ mobileNumber });
    }

    const userExists = await User.findOne({
      where: {
        [Op.or]: conditions,
      },
    });
    if (userExists) {
      res.status(400).json({ message: "User already exists", status: false });
      return;
    }
    if (!name || !password || !mobileNumber) {
      res
        .status(442)
        .json({ message: "All Fields are required", status: false });
      return;
    }

    const user = await User.create({
      name,
      email,
      password: password,
      role: "user",
      mobileNumber,
      countryCode,
      countryName,
      countryISO,
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: `${user.countryCode}${user.mobileNumber}`,
        isDisabled: user.isDisabled,
        avatar: user.avatar,
        countryISO: user.countryISO,
        countryName: user.countryName,
      },
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
      const blockRecord = await BlockedUser.findOne({
        where: { userId: user?.id },
        order: [["createdAt", "DESC"]], // 👈 latest record first
      });
      if (blockRecord?.actionTaken == "permanentBan" && blockRecord.isBlocked) {
        res.status(200).json({
          message: "Your Blocked permanenlty please contect admin support!",
          reason: blockRecord.reason,
          status: false,
        });
        return;
      }
      if (blockRecord?.actionTaken == "temporaryBan" && blockRecord.isBlocked) {
        res.status(200).json({
          message: "Your Blocked  please contect admin support!",
          reason: blockRecord.reason,
          status: false,
        });
        return;
      }

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
      status: user.isActive,
      lastLogin: user.lastLogin,
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
    const users = await getUserListWithLastMessage(currentUserId, true);

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
