import express from "express";

import { protect } from "../middleware/auth.js";
import {
  MasterKeyEntry,
  VaultStore,
  upsertMongoEntry,
  deleteMongoEntry,
  deleteAllMongoEntries,
  listMongoEntries,
} from "../models/index.js";
import type { VaultCategory, VaultEntryRecord } from "../models/index.js";
import { decryptText, encryptText } from "../utils/crypto.js";
import { errorMessage } from "../utils/errors.js";

const router = express.Router();
const MASTER_KEY_VERIFY = "Pass-up@2026";

/** Master Key arrives only via request header — never read from or written to DB. */
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

const decryptEntry = (
  entry: VaultEntryRecord,
  masterKey: string,
): Record<string, unknown> => {
  const entryObj: Record<string, unknown> = { ...entry };
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

/** Prefer SQLite for speed; hydrate from MongoDB when the cache is empty. */
async function listCachedEntries(userId: string): Promise<VaultEntryRecord[]> {
  let entries = VaultStore.listByUser(userId);
  if (entries.length === 0) {
    const mongoEntries = await listMongoEntries(userId);
    if (mongoEntries.length > 0) {
      VaultStore.replaceAllForUser(userId, mongoEntries);
      entries = VaultStore.listByUser(userId);
    }
  }
  return entries;
}

router.get("/entries", protect, async (req, res) => {
  try {
    const entries = await listCachedEntries(req.userId!);
    const masterKey = getMasterKey(req);

    if (masterKey) {
      const decryptedEntries = entries.map((entry) =>
        decryptEntry(entry, masterKey),
      );
      return res.json({ status: "success", entries: decryptedEntries });
    }

    const lockedEntries = entries.map((entry) => ({
      _id: entry._id,
      entryID: entry.entryID,
      title: entry.title,
      category: entry.category || "login",
      favorite: Boolean(entry.favorite),
      tags: entry.tags || [],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      locked: true,
    }));

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

    // Fast path: SQLite cache
    const entry = VaultStore.create({
      userId: req.userId!,
      entryID:
        typeof entryID === "string" && entryID.trim()
          ? entryID.trim()
          : undefined,
      title,
      category: category as VaultCategory,
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

    // Durable copy in MongoDB (same ciphertext, never master key)
    await upsertMongoEntry(entry);

    res.json({ status: "success", entry: decryptEntry(entry, masterKey) });
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

  const entryId = String(req.params.id);

  try {
    const existing = VaultStore.findByIdForUser(entryId, req.userId!);
    if (!existing) {
      return res
        .status(404)
        .json({ status: "error", message: "Entry not found" });
    }

    const masterKey = getMasterKey(req);
    const patch: Parameters<typeof VaultStore.update>[2] = {};

    if (title !== undefined) patch.title = title;
    if (category !== undefined) patch.category = category as VaultCategory;
    if (url !== undefined) patch.url = url;
    if (username !== undefined) patch.username = username;
    if (email !== undefined) patch.email = email;
    if (notes !== undefined) patch.notes = notes;
    if (tags !== undefined) patch.tags = tags;
    if (favorite !== undefined) patch.favorite = Boolean(favorite);

    if (password !== undefined) {
      if (!masterKey) {
        return res.status(400).json({
          status: "error",
          message: "Master Key header is required to update password",
        });
      }
      patch.password = encryptText(password, masterKey);
      patch.strength = strength || estimateStrength(password);
    }

    if (cardDetails !== undefined) {
      if (!masterKey) {
        return res.status(400).json({
          status: "error",
          message: "Master Key header is required to update card details",
        });
      }
      patch.cardDetails = encryptText(JSON.stringify(cardDetails), masterKey);
      if (!password && cardDetails.cardNumber) {
        patch.password = encryptText(cardDetails.cardNumber, masterKey);
      }
    }

    const entry = VaultStore.update(entryId, req.userId!, patch);
    if (!entry) {
      return res
        .status(404)
        .json({ status: "error", message: "Entry not found" });
    }

    await upsertMongoEntry(entry);

    const payload = masterKey ? decryptEntry(entry, masterKey) : { ...entry };
    res.json({ status: "success", entry: payload });
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.delete("/entries/:id", protect, async (req, res) => {
  try {
    const id = String(req.params.id);
    const deleted = VaultStore.deleteByIdForUser(id, req.userId!);
    await deleteMongoEntry(id, req.userId!);
    if (!deleted) {
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
    const entry = VaultStore.findByIdForUser(
      String(req.params.id),
      req.userId!,
    );
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

/**
 * Push SQLite → MongoDB, then pull MongoDB → SQLite.
 * Keeps durable cloud copy in sync while refreshing the fast local cache.
 */
router.post("/sync", protect, async (req, res) => {
  try {
    const userId = req.userId!;
    const localEntries = VaultStore.listByUser(userId);

    let pushed = 0;
    for (const entry of localEntries) {
      await upsertMongoEntry(entry);
      pushed += 1;
    }

    const cloudEntries = await listMongoEntries(userId);
    VaultStore.replaceAllForUser(userId, cloudEntries);

    res.json({
      status: "success",
      message: "Sync complete",
      pushed,
      pulled: cloudEntries.length,
      lastSyncTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sync error:", error);
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

    const entries = VaultStore.listByUser(req.userId!);
    for (const vaultEntry of entries) {
      try {
        const decryptedPassword = decryptText(
          vaultEntry.password,
          oldMasterKey,
        );
        const patch: Parameters<typeof VaultStore.update>[2] = {
          password: encryptText(decryptedPassword, newMasterKey),
        };
        if (vaultEntry.cardDetails) {
          const cardPlain = decryptText(vaultEntry.cardDetails, oldMasterKey);
          patch.cardDetails = encryptText(cardPlain, newMasterKey);
        }
        const updated = VaultStore.update(vaultEntry._id, req.userId!, patch);
        if (updated) await upsertMongoEntry(updated);
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
