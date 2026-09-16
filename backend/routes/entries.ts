import express from "express";

import { protect } from "../middleware/auth.js";
import { MasterKeyEntry, VaultEntry } from "../models/index.js";
import { decryptText, encryptText } from "../utils/crypto.js";
import { errorMessage } from "../utils/errors.js";

const router = express.Router();
const MASTER_KEY_VERIFY = "Pass-up@2026";

const getMasterKey = (req: express.Request) => {
  const value = req.headers["x-master-key"];
  return typeof value === "string" ? value : undefined;
};

router.get("/entries", protect, async (req, res) => {
  try {
    const entries = await VaultEntry.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    const masterKey = getMasterKey(req);

    if (masterKey) {
      const decryptedEntries = entries.map((entry) => {
        const entryObj = entry.toObject();
        try {
          if (entryObj.password) {
            entryObj.password = decryptText(entryObj.password, masterKey);
          }
        } catch (err) {
          console.error(`Failed to decrypt password for entry ${entry._id}:`, err);
        }
        return entryObj;
      });
      return res.json({ status: "success", entries: decryptedEntries });
    }

    res.json({ status: "success", entries });
  } catch (error) {
    console.error("Fetch entries error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.post("/entries", protect, async (req, res) => {
  const {
    entryID,
    title,
    url,
    username,
    email,
    password,
    notes,
    tags,
    strength,
  } = req.body || {};
  if (!title || !password || (!username && !email)) {
    return res.status(400).json({
      status: "error",
      message: "Title, Password, and either Username or Email are required",
    });
  }
  const masterKey = getMasterKey(req);
  if (!masterKey) {
    return res
      .status(400)
      .json({ status: "error", message: "Master Key header is required" });
  }
  try {
    const entry = await VaultEntry.create({
      userId: req.userId,
      entryID,
      title,
      url,
      username,
      email,
      password: encryptText(password, masterKey),
      notes,
      tags: tags || [],
      strength: strength || "Medium",
    });
    res.json({ status: "success", entry });
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.put("/entries/:id", protect, async (req, res) => {
  const { title, url, username, email, password, notes, tags, strength } =
    req.body || {};
  try {
    const entry = await VaultEntry.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!entry) {
      return res
        .status(404)
        .json({ status: "error", message: "Entry not found" });
    }
    if (title !== undefined) entry.title = title;
    if (url !== undefined) entry.url = url;
    if (username !== undefined) entry.username = username;
    if (email !== undefined) entry.email = email;
    if (password !== undefined) {
      const masterKey = getMasterKey(req);
      if (!masterKey) {
        return res.status(400).json({
          status: "error",
          message: "Master Key header is required to update password",
        });
      }
      entry.password = encryptText(password, masterKey);
      entry.strength = strength || "Strong";
    }
    if (notes !== undefined) entry.notes = notes;
    if (tags !== undefined) entry.tags = tags;
    await entry.save();
    res.json({ status: "success", entry });
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.delete("/entries/:id", protect, async (req, res) => {
  try {
    const result = await VaultEntry.deleteOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Entry not found" });
    }
    res.json({ status: "success", message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.get("/password/:id", protect, async (req, res) => {
  try {
    const masterKey = getMasterKey(req);
    if (!masterKey) {
      return res
        .status(400)
        .json({ status: "error", message: "Master Key header is required" });
    }
    const entry = await VaultEntry.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!entry) {
      return res
        .status(404)
        .json({ status: "error", message: "Entry not found" });
    }
    const decrypted = decryptText(entry.password, masterKey);
    res.json({ status: "success", data: decrypted });
  } catch (error) {
    console.error("Get password error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.get("/check-master-key", protect, async (req, res) => {
  const masterKey = getMasterKey(req);
  if (!masterKey) {
    return res
      .status(400)
      .json({ status: "error", message: "Master Key header is required" });
  }
  try {
    let entry = await MasterKeyEntry.findOne({ userId: req.userId });

    if (!entry) {
      const encrypted = encryptText(MASTER_KEY_VERIFY, masterKey);
      entry = await MasterKeyEntry.create({
        userId: req.userId,
        masterkeyencrypt: encrypted,
      });
      return res.json({
        status: "success",
        message: "Master key set up successfully",
        data: encrypted,
      });
    }

    try {
      const decrypted = decryptText(entry.masterkeyencrypt!, masterKey);
      if (decrypted === MASTER_KEY_VERIFY) {
        return res.json({
          status: "success",
          message: "Master key verified",
          data: entry.masterkeyencrypt,
        });
      }
      return res
        .status(400)
        .json({ status: "error", message: "Incorrect Master Key" });
    } catch {
      return res
        .status(400)
        .json({ status: "error", message: "Incorrect Master Key" });
    }
  } catch (error) {
    console.error("Check master key error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

router.post("/update-master-key", protect, async (req, res) => {
  const { oldMasterKey, newMasterKey } = req.body || {};
  if (!oldMasterKey || !newMasterKey) {
    return res.status(400).json({
      status: "error",
      message: "Current master key and new master key are required.",
    });
  }
  if (newMasterKey.length < 4) {
    return res.status(400).json({
      status: "error",
      message: "New master key must be at least 4 characters.",
    });
  }
  try {
    const entry = await MasterKeyEntry.findOne({ userId: req.userId });
    if (!entry) {
      const encrypted = encryptText(MASTER_KEY_VERIFY, newMasterKey);
      await MasterKeyEntry.create({
        userId: req.userId,
        masterkeyencrypt: encrypted,
      });
      return res.json({
        status: "success",
        message: "Master key set up successfully.",
      });
    }

    try {
      const decrypted = decryptText(entry.masterkeyencrypt!, oldMasterKey);
      if (decrypted !== MASTER_KEY_VERIFY) {
        return res.status(400).json({
          status: "error",
          message: "Incorrect current Master Key.",
        });
      }
    } catch {
      return res.status(400).json({
        status: "error",
        message: "Incorrect current Master Key.",
      });
    }

    const entries = await VaultEntry.find({ userId: req.userId });
    for (const vaultEntry of entries) {
      try {
        const decryptedPassword = decryptText(vaultEntry.password, oldMasterKey);
        vaultEntry.password = encryptText(decryptedPassword, newMasterKey);
        await vaultEntry.save();
      } catch (err) {
        console.error(`Error re-encrypting entry ${vaultEntry._id}:`, err);
      }
    }

    entry.masterkeyencrypt = encryptText(MASTER_KEY_VERIFY, newMasterKey);
    await entry.save();

    res.json({ status: "success", message: "Master key updated successfully." });
  } catch (error) {
    console.error("Update master key error:", error);
    res.status(500).json({
      status: "error",
      message: errorMessage(error, "Internal server error."),
    });
  }
});

export default router;
