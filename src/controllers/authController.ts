import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";

// Register
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists", status: false });
      return;
    }
    const user = await User.create({
      name,
      email,
      password: password,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
      status: true,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message, status: false });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    console.log("User found:", user); // Debugging line

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
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
      status: true,
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
      res.status(404).json({ msg: "No user found!", status: false });
      return;
    }
    res.status(200).json({
      msg: "success",
      status: true,
      user,
    });
  } catch (err) {
    console.log("ths is error", err);

    res.status(500).json({ msg: "Something went wrong!", status: false });
  }
};
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find({ _id: { $ne: req.user?._id } }).select(
      "-password"
    );
    res.status(200).json({ users, status: true, msg: "success" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong!", status: false });
  }
};
