import crypto from "crypto";
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

const estimateStrength = (password: string): string => {
  if (!password) return "Weak";
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return "Weak";
  if (score <= 4) return "Medium";
  return "Strong";
};

const decryptEntry = (entryObj: Record<string, unknown>, masterKey: string) => {
  try {
    if (typeof entryObj.password === "string" && entryObj.password) {
      entryObj.password = decryptText(entryObj.password, masterKey);
    }
  } catch (err) {
    console.error(`Failed to decrypt password for entry ${entryObj._id}:`, err);
  }
  try {
    if (typeof entryObj.cardDetails === "string" && entryObj.cardDetails) {
      entryObj.cardDetails = JSON.parse(
        decryptText(entryObj.cardDetails, masterKey),
      );
    }
  } catch {
    // leave encrypted/raw if decrypt fails
  }
  return entryObj;
};

router.get("/entries", protect, async (req, res) => {
  try {
    const entries = await VaultEntry.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    const masterKey = getMasterKey(req);

    if (masterKey) {
      const decryptedEntries = entries.map((entry) =>
        decryptEntry(
          entry.toObject() as unknown as Record<string, unknown>,
          masterKey,
        ),
      );
      return res.json({ status: "success", entries: decryptedEntries });
    }

    // Locked preview: metadata only (no secrets / plaintext credentials)
    const lockedEntries = entries.map((entry) => {
      const obj = entry.toObject() as unknown as Record<string, unknown>;
      return {
        _id: obj._id,
        entryID: obj.entryID,
        title: obj.title,
        category: obj.category || "login",
        favorite: Boolean(obj.favorite),
        tags: obj.tags || [],
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
        locked: true,
      };
    });

    res.json({ status: "success", entries: lockedEntries, locked: true });
  } catch (error) {
    console.error("Fetch entries error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.post("/entries", protect, async (req, res) => {
  const {
    entryID,
    title,
    category = "login",
    url,
    username,
    email,
    password,
    notes,
    tags,
    strength,
    favorite,
    cardDetails,
  } = req.body || {};

  if (!title) {
    return res.status(400).json({
      status: "error",
      message: "Title is required",
    });
  }

  if (category === "login" || category === "api_key") {
    if (!password || (!username && !email)) {
      return res.status(400).json({
        status: "error",
        message: "Password and either Username or Email are required",
      });
    }
  }

  if (category === "note" && !notes) {
    return res.status(400).json({
      status: "error",
      message: "Notes content is required",
    });
  }

  if (category === "card" && !cardDetails?.cardNumber) {
    return res.status(400).json({
      status: "error",
      message: "Card number is required",
    });
  }

  const masterKey = getMasterKey(req);
  if (!masterKey) {
    return res
      .status(400)
      .json({ status: "error", message: "Master Key header is required" });
  }

  try {
    const secret =
      password ||
      (category === "card" ? cardDetails.cardNumber : notes) ||
      "secure-note";

    const resolvedEntryId =
      typeof entryID === "string" && entryID.trim()
        ? entryID.trim()
        : crypto.randomUUID();

    const entry = await VaultEntry.create({
      userId: req.userId,
      entryID: resolvedEntryId,
      title,
      category,
      url,
      username,
      email,
      password: encryptText(secret, masterKey),
      notes,
      tags: tags || [],
      strength: strength || estimateStrength(password || ""),
      favorite: Boolean(favorite),
      cardDetails: cardDetails
        ? encryptText(JSON.stringify(cardDetails), masterKey)
        : undefined,
    });

    const responseEntry = decryptEntry(
      entry.toObject() as unknown as Record<string, unknown>,
      masterKey,
    );
    res.json({ status: "success", entry: responseEntry });
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.put("/entries/:id", protect, async (req, res) => {
  const {
    title,
    category,
    url,
    username,
    email,
    password,
    notes,
    tags,
    strength,
    favorite,
    cardDetails,
  } = req.body || {};

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
    if (category !== undefined) entry.category = category;
    if (url !== undefined) entry.url = url;
    if (username !== undefined) entry.username = username;
    if (email !== undefined) entry.email = email;
    if (notes !== undefined) entry.notes = notes;
    if (tags !== undefined) entry.tags = tags;
    if (favorite !== undefined) entry.favorite = Boolean(favorite);

    const masterKey = getMasterKey(req);

    if (password !== undefined) {
      if (!masterKey) {
        return res.status(400).json({
          status: "error",
          message: "Master Key header is required to update password",
        });
      }
      entry.password = encryptText(password, masterKey);
      entry.strength = strength || estimateStrength(password);
    }

    if (cardDetails !== undefined) {
      if (!masterKey) {
        return res.status(400).json({
          status: "error",
          message: "Master Key header is required to update card details",
        });
      }
      entry.cardDetails = encryptText(JSON.stringify(cardDetails), masterKey);
      if (!password && cardDetails.cardNumber) {
        entry.password = encryptText(cardDetails.cardNumber, masterKey);
      }
    }

    await entry.save();

    const payload = entry.toObject() as unknown as Record<string, unknown>;
    if (masterKey) {
      decryptEntry(payload, masterKey);
    }
    res.json({ status: "success", entry: payload });
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
        isNew: true,
        data: encrypted,
      });
    }

    try {
      const decrypted = decryptText(entry.masterkeyencrypt!, masterKey);
      if (decrypted === MASTER_KEY_VERIFY) {
        return res.json({
          status: "success",
          message: "Master key verified",
          isNew: false,
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

router.get("/master-key-status", protect, async (req, res) => {
  try {
    const entry = await MasterKeyEntry.findOne({ userId: req.userId });
    res.json({
      status: "success",
      hasMasterKey: Boolean(entry?.masterkeyencrypt),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: errorMessage(error) });
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
  if (newMasterKey.length < 8) {
    return res.status(400).json({
      status: "error",
      message: "New master key must be at least 8 characters.",
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
        if (vaultEntry.cardDetails) {
          const cardPlain = decryptText(vaultEntry.cardDetails, oldMasterKey);
          vaultEntry.cardDetails = encryptText(cardPlain, newMasterKey);
        }
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
