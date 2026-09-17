import express from "express";

import { protect } from "../middleware/auth.js";
import {
  MasterKeyEntry,
  RecoveryKit,
  VaultStore,
  deleteAllMongoEntries,
} from "../models/index.js";
import { encryptText } from "../utils/crypto.js";
import { errorMessage } from "../utils/errors.js";
import {
  generateBackupCodes,
  generateRecoverySeedWords,
  generateTotpSecret,
  hashSeedWords,
  verifySeedWords,
} from "../utils/recovery.js";

const router = express.Router();
const MASTER_KEY_VERIFY = "Pass-up@2026";

const kitPayload = (kit: {
  enabled: boolean;
  totpSecret: string;
  backupCodes: string[];
  recoverySeedWords: string[];
  lastVerifiedAt?: Date;
}) => ({
  enabled: kit.enabled,
  secret: kit.totpSecret,
  backupCodes: kit.backupCodes,
  recoverySeedWords: kit.recoverySeedWords,
  lastVerifiedAt: kit.lastVerifiedAt?.toISOString(),
});

router.get("/recovery-kit", protect, async (req, res) => {
  try {
    let kit = await RecoveryKit.findOne({ userId: req.userId });
    if (!kit) {
      const recoverySeedWords = generateRecoverySeedWords(12);
      kit = await RecoveryKit.create({
        userId: req.userId,
        enabled: true,
        totpSecret: generateTotpSecret(),
        backupCodes: generateBackupCodes(),
        recoverySeedWords,
        seedHash: hashSeedWords(recoverySeedWords),
      });
    }
    res.json({ status: "success", recovery: kitPayload(kit) });
  } catch (error) {
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.post("/recovery-kit/regenerate", protect, async (req, res) => {
  try {
    const recoverySeedWords = generateRecoverySeedWords(12);
    const payload = {
      enabled: true,
      totpSecret: generateTotpSecret(),
      backupCodes: generateBackupCodes(),
      recoverySeedWords,
      seedHash: hashSeedWords(recoverySeedWords),
      lastVerifiedAt: undefined,
    };

    const kit = await RecoveryKit.findOneAndUpdate(
      { userId: req.userId },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ status: "success", recovery: kitPayload(kit!) });
  } catch (error) {
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

router.post("/recovery/verify-seed", protect, async (req, res) => {
  const { seedWords } = req.body || {};
  if (!Array.isArray(seedWords) || seedWords.length < 12) {
    return res.status(400).json({
      status: "error",
      message: "Provide all 12 recovery seed words.",
    });
  }
  try {
    const kit = await RecoveryKit.findOne({ userId: req.userId });
    if (!kit) {
      return res.status(404).json({
        status: "error",
        message: "No recovery kit found. Open Settings → 2FA to generate one.",
      });
    }
    if (!verifySeedWords(seedWords, kit.seedHash)) {
      return res.status(400).json({
        status: "error",
        message: "Recovery phrase is incorrect.",
      });
    }
    kit.lastVerifiedAt = new Date();
    await kit.save();
    res.json({ status: "success", message: "Recovery phrase verified." });
  } catch (error) {
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

/**
 * Recover vault access when Master Key is lost.
 * Requires valid 12-word seed. Existing ciphertext cannot be recovered,
 * so vault entries are wiped and a new master key verifier is set.
 */
router.post("/recovery/reset-master-key", protect, async (req, res) => {
  const { seedWords, newMasterKey } = req.body || {};
  if (!Array.isArray(seedWords) || seedWords.length < 12) {
    return res.status(400).json({
      status: "error",
      message: "Provide all 12 recovery seed words.",
    });
  }
  if (!newMasterKey || String(newMasterKey).length < 8) {
    return res.status(400).json({
      status: "error",
      message: "New master key must be at least 8 characters.",
    });
  }
  try {
    const kit = await RecoveryKit.findOne({ userId: req.userId });
    if (!kit || !verifySeedWords(seedWords, kit.seedHash)) {
      return res.status(400).json({
        status: "error",
        message: "Recovery phrase is incorrect.",
      });
    }

    // Wipe SQLite cache + MongoDB durable store (old ciphertext unrecoverable)
    VaultStore.deleteAllForUser(req.userId!);
    await deleteAllMongoEntries(req.userId!);

    // Store only a new verifier blob — never the Master Key itself
    const encrypted = encryptText(MASTER_KEY_VERIFY, String(newMasterKey));
    await MasterKeyEntry.findOneAndUpdate(
      { userId: req.userId },
      { masterkeyencrypt: encrypted },
      { upsert: true, new: true },
    );

    kit.lastVerifiedAt = new Date();
    await kit.save();

    res.json({
      status: "success",
      message:
        "Master key reset. Previous vault items were wiped because they could not be decrypted without the old key.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: errorMessage(error) });
  }
});

export default router;
