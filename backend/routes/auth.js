import express from 'express';
import crypto from 'crypto';
import { User } from '../models/index.js';

const router = express.Router();

// Password hashing helper functions using pbkdf2
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) return false;
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// POST /login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  console.log("Login request received in backend:", { email });

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    res.json({ 
      status: "success", 
      token: user._id.toString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

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
      token: user._id.toString(),
      user: {
        id: user._id.toString(),
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
