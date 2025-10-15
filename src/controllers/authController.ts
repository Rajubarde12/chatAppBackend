import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { log } from "console";
import { Op } from "sequelize";
import { getUserListWithLastMessage } from "./common";

// Register
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400).json({ message: "User already exists", status: false });
      return;
    }
    if (!name || !email || !password) {
      res
        .status(442)
        .json({ message: "All Fields are required", status: false });
        return
    }
    const user = await User.create({
      name,
      email,
      password: password,
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
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res
        .status(401)
        .json({ message: "Invalid email or password", status: false });
      return;
    }

    const isMatch = await user.matchPassword(password);
    console.log("Password match:", isMatch); // Debugging line

    if (!isMatch) {
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
}