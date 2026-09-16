import express from "express";

import { generateToken, protect } from "../middleware/auth.js";
import User from "../models/User.js";
import { errorMessage } from "../utils/errors.js";

const router = express.Router();

const userPayload = (user: {
  _id: unknown;
  email: string;
  name: string;
}) => ({
  _id: user._id,
  id: String(user._id),
  email: user.email,
  name: user.name,
});

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }
  if (String(password).length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }
  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const user = await User.create({
      email: normalizedEmail,
      password,
      name: name?.trim() || normalizedEmail.split("@")[0],
    });
    res.status(201).json({
      token: generateToken(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  try {
    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid email or password." });
    res.json({ token: generateToken(user._id), user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

router.post("/logout", (_req, res) =>
  res.json({ message: "Logged out successfully." }),
);

router.post("/forgot-password", async (req, res) => {
  if (!req.body.email)
    return res.status(400).json({ message: "Email is required." });
  try {
    await User.findOne({ email: req.body.email });
    res.json({
      message:
        "If an account exists for this email, password reset instructions will be sent.",
    });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

router.get("/me", protect, (req, res) => res.json(userPayload(req.user!)));

router.patch("/profile", protect, async (req, res) => {
  const { name, password, currentPassword } = req.body;
  try {
    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (name !== undefined) user.name = name;
    if (password) {
      if (!currentPassword)
        return res.status(400).json({ message: "Current password required." });
      if (!(await user.comparePassword(currentPassword)))
        return res
          .status(401)
          .json({ message: "Current password is incorrect." });
      user.password = password;
    }
    await user.save();
    res.json(userPayload(user));
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
});

export default router;
