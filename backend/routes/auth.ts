



import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../model/AdminUser";
const router = express.Router();
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  JWT_SECRET,
  getAuthToken,
} from "../config/security";



export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password, token: deviceToken, firebaseToken } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admin = await AdminUser.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({
        status: "error",
        success: false,
        message: "Invalid admin email or password",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        status: "error",
        success: false,
        message: "Admin account is deactivated",
      });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) {
      return res.status(401).json({
        status: "error",
        success: false,
        message: "Invalid admin email or password",
      });
    }

    const incomingDeviceToken = firebaseToken || deviceToken;
    if (incomingDeviceToken && typeof incomingDeviceToken === "string") {
      admin.firebaseToken = incomingDeviceToken.trim();
      await admin.save();
    }

    const authToken = jwt.sign(
      {
        userId: admin._id,
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie(AUTH_COOKIE_NAME, authToken, authCookieOptions);

    return res.status(200).json({
      status: "success",
      success: true,
      token: authToken,
      user: {
        id: admin._id.toString(),
        _id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: "admin",
        firebaseToken: admin.firebaseToken,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("[ADMIN] Login error:", error);
    return res.status(500).json({
      status: "error",
      success: false,
      message: "Internal server error during admin login",
    });
  }
};


// POST /register endpoint
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  console.log("Registration request received in backend:", { name, email });

  if (!name || !email || !password) {
    return res.status(400).json({ status: "error", message: "Name, email, and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: "error", message: "Email is already registered" });
    }

    const hashedPassword = hashPassword(password);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    await user.save();

    res.json({ 
      status: "success", 
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

export default router;
