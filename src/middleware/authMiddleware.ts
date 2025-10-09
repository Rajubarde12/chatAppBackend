import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface JwtPayload {
  id: string;
}

// Extend Request interface to include user
export interface AuthRequest extends Request {
  user?: User;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      const user = await User.findByPk(decoded.id,{attributes: { exclude: ['password'] }});
      if (!user) {
        res.status(401).json({ message: "Not authorized" });
        return;
      }

      req.user = user; // attach user to request
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
