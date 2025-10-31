import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";

interface JwtPayload {
  id: string;
}

// Extend Request interface to include user
export interface AuthRequest extends Request {
  user?: User;
}

export const superAdminMiddeleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role != "SuperAdmin") {
    return res.status(401).json({
      message: "You dont have access",
      status: false,
    });
  }
  next();
};
