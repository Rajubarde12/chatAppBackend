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

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, countryCode = "+91" } = req.body || {};

    if (!mobileNumber) {
      return res.status(400).json({ error: "Mobile number is required" });
    }
    let user = await User.findOne({ where: { mobileNumber, countryCode } });
    if (!user) {
      user = await User.create({ name: "New User", mobileNumber, countryCode });
    }
    if (user.isOtpBlocked()) {
      return res.status(429).json({
        error: "Too many failed OTP attempts. Please try again later.",
      });
    }

    if (!user.canResendOtp()) {
      return res.status(429).json({
        message: "Please wait before requesting a new OTP.",
      });
    }
    const otp = User.generateOtp();
    const otpExpires = User.getOtpExpiration();

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.lastOtpSent = new Date();
    user.otpRetryCount = 0; // reset retry count

    await user.save();
    console.log(`📲 OTP for ${mobileNumber}: ${otp}`);

    return res.status(200).json({
      message: "OTP sent successfully",
      expiresIn: "10 minutes",
      otp,
    });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, countryCode = "+91", otp } = req.body;

    if (!mobileNumber || !otp) {
      return res
        .status(400)
        .json({ error: "Mobile number and OTP are required" });
    }

    const user = await User.findOne({ where: { mobileNumber, countryCode } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If OTP expired or invalid
    const isValid = await user.validateOtp(otp);

    if (!isValid) {
      user.incrementOtpRetryCount();
      await user.save();

      if (user.isOtpBlocked()) {
        return res.status(429).json({
          error: "Too many failed attempts. Please try again later.",
        });
      }

      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // ✅ OTP is valid — mark as verified
    user.isVerified = true;
    user.otp = "";
    user.otpExpires = undefined;
    user.otpRetryCount = 0;
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
        token: generateToken(user.id.toString()),
      },
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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

export const uploadProfimeImageContorller = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }
    const user = req?.user;
    if (!user) {
      res.status(400).json({stauts:false, message: "Not Autorized!" });
      return;
    }
    user.avatar = req.file.path;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Profile image uploaded successfully",
      avtar: user.avatar,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
