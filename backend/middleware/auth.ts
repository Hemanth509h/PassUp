import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";

import User from "../models/User.js";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Server misconfigured: JWT_SECRET is missing. Set it in the host environment.",
    );
  }
  return "passup_dev_secret_change_in_prod";
}

/** Fail fast in production when JWT_SECRET is unset. */
export function assertJwtSecretConfigured(): void {
  if (process.env.NODE_ENV !== "production") return;
  getJwtSecret();
}

/** Public API routes that do not require a Bearer token. */
const PUBLIC_API_ROUTES = new Set([
  "GET /api-status",
  "POST /register",
  "POST /login",
  "POST /logout",
  "POST /forgot-password",
]);

export const generateToken = (userId: string | Types.ObjectId) => jwt.sign({ id: userId.toString() }, getJwtSecret(), { expiresIn: "30d" });

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found." });
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

/** Require auth for every route except the public allowlist. */
export const requireApiAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const routeKey = `${req.method} ${req.path}`;
  if (PUBLIC_API_ROUTES.has(routeKey)) {
    return next();
  }
  return protect(req, res, next);
};
