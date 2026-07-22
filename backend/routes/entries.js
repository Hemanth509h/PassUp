import express from 'express';
import { VaultEntry, MasterKeyEntry } from '../models/index.js';
import { encryptText, decryptText } from '../utils/crypto.js';

const router = express.Router();

// Middleware to authenticate user by token (using raw userId as token for simplicity)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];

  // Validate if token is a valid MongoDB ObjectId
  if (!token.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(401).json({ status: 'error', message: 'Session expired. Please log out and log back in.' });
  }

  req.userId = token;
  next();
};

// GET /entries - Fetch user's entries
router.get('/entries', authenticate, async (req, res) => {
  try {
    const entries = await VaultEntry.find({ userId: req.userId }).sort({ createdAt: -1 });
    const masterKey = req.headers['x-master-key'];
    
    if (masterKey) {
      const decryptedEntries = entries.map(entry => {
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
      return res.json({ status: 'success', entries: decryptedEntries });
    }
    
    res.json({ status: 'success', entries });
  } catch (error) {
    console.error("Fetch entries error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /entries - Create a new entry
router.post('/entries', authenticate, async (req, res) => {
  const { entryID, title, url, username, email, password, notes, tags, strength } = req.body || {};
  if (!title || !password || (!username && !email)) {
    return res.status(400).json({ status: 'error', message: 'Title, Password, and either Username or Email are required' });
  }
  const masterKey = req.headers['x-master-key'];
  if (!masterKey) {
    return res.status(400).json({ status: 'error', message: 'Master Key header is required' });
  }
  try {
    const encryptedPassword = encryptText(password, masterKey);
    const entry = new VaultEntry({
      userId: req.userId,
      entryID,
      title,
      url,
      username,
      email,
      password: encryptedPassword,
      notes,
      tags: tags || [],
      strength: strength || 'Medium'
    });
    await entry.save();
    res.json({ status: 'success', entry });
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /entries/:id - Update an entry
router.put('/entries/:id', authenticate, async (req, res) => {
  const { title, url, username, email, password, notes, tags, strength } = req.body || {};
  try {
    const entry = await VaultEntry.findOne({ _id: req.params.id, userId: req.userId });
    if (!entry) {
      return res.status(404).json({ status: 'error', message: 'Entry not found' });
    }
    if (title !== undefined) entry.title = title;
    if (url !== undefined) entry.url = url;
    if (username !== undefined) entry.username = username;
    if (email !== undefined) entry.email = email;
    if (password !== undefined) {
      const masterKey = req.headers['x-master-key'];
      if (!masterKey) {
        return res.status(400).json({ status: 'error', message: 'Master Key header is required to update password' });
      }
      entry.password = encryptText(password, masterKey);
      entry.strength = strength || 'Strong';
    }
    if (notes !== undefined) entry.notes = notes;
    if (tags !== undefined) entry.tags = tags;
    await entry.save();
    res.json({ status: 'success', entry });
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// DELETE /entries/:id - Delete an entry
router.delete('/entries/:id', authenticate, async (req, res) => {
  try {
    const result = await VaultEntry.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Entry not found' });
    }
    res.json({ status: 'success', message: 'Entry deleted successfully' });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /password/:id - Get password for an entry
router.get('/password/:id', authenticate, async (req, res) => {
  try {
    const masterKey = req.headers['x-master-key'];
    if (!masterKey) {
      return res.status(400).json({ status: 'error', message: 'Master Key header is required' });
    }
    const entry = await VaultEntry.findOne({ _id: req.params.id, userId: req.userId });
    if (!entry) {
      return res.status(404).json({ status: 'error', message: 'Entry not found' });
    }
    const decrypted = decryptText(entry.password, masterKey);
    res.json({ status: 'success', data: decrypted });
  } catch (error) {
    console.error("Get password error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});


router.get('/check-master-key', authenticate, async (req, res) => {
  const masterKey = req.headers['x-master-key'];

  if (!masterKey) {
    return res.status(400).json({
      status: 'error',
      message: 'Master Key header is required'
    });
  }
  try {
    let entry = await MasterKeyEntry.findOne({ userId: req.userId });
    console.log("Master Key Entry:", entry);

    if (!entry) {
      // First-time setup: Encrypt a verification token and store it
      const encrypted = encryptText('Pass-up@2026', masterKey);
      entry = new MasterKeyEntry({
        userId: req.userId,
        masterkeyencrypt: encrypted
      });
      await entry.save();
      return res.json({ status: 'success', message: 'Master key set up successfully', data: encrypted });
    }

    // Since encryptText uses random salt and IV, we cannot simply encrypt again and compare strings.
    // Instead, we decrypt the stored value using the provided masterKey. If it successfully
    // decrypts back to 'Pass-up@2026', we know the key is correct.
    try {
      const decrypted = decryptText(entry.masterkeyencrypt, masterKey);
      if (decrypted === 'Pass-up@2026') {
        return res.json({ status: 'success', message: 'Master key verified', data: entry.masterkeyencrypt });
      } else {
        return res.status(400).json({ status: 'error', message: 'Incorrect Master Key' });
      }
    } catch (decryptError) {
      return res.status(400).json({ status: 'error', message: 'Incorrect Master Key' });
    }
  } catch (error) {
    console.error("Check master key error:", error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /update-master-key - Update the user's master key and re-encrypt credentials
router.post('/update-master-key', authenticate, async (req, res) => {
  const { oldMasterKey, newMasterKey } = req.body || {};
  if (!oldMasterKey || !newMasterKey) {
    return res.status(400).json({ status: 'error', message: 'Current master key and new master key are required.' });
  }
  if (newMasterKey.length < 4) {
    return res.status(400).json({ status: 'error', message: 'New master key must be at least 4 characters.' });
  }
  try {
    // 1. Verify oldMasterKey
    const entry = await MasterKeyEntry.findOne({ userId: req.userId });
    if (!entry) {
      // If they don't have a master key set yet (first-time), we can just set it
      const encrypted = encryptText('Pass-up@2026', newMasterKey);
      const newEntry = new MasterKeyEntry({
        userId: req.userId,
        masterkeyencrypt: encrypted
      });
      await newEntry.save();
      return res.json({ status: 'success', message: 'Master key set up successfully.' });
    }

    try {
      const decrypted = decryptText(entry.masterkeyencrypt, oldMasterKey);
      if (decrypted !== 'Pass-up@2026') {
        return res.status(400).json({ status: 'error', message: 'Incorrect current Master Key.' });
      }
    } catch (decryptError) {
      return res.status(400).json({ status: 'error', message: 'Incorrect current Master Key.' });
    }

    // 2. Fetch all user vault entries
    const entries = await VaultEntry.find({ userId: req.userId });

    // 3. Decrypt entries using old master key and re-encrypt using new master key
    const reEncryptedEntries = [];
    for (const vaultEntry of entries) {
      try {
        const decryptedPassword = decryptText(vaultEntry.password, oldMasterKey);
        const encryptedNewPassword = encryptText(decryptedPassword, newMasterKey);
        reEncryptedEntries.push({
          entry: vaultEntry,
          newPassword: encryptedNewPassword
        });
      } catch (err) {
        console.error(`Error decrypting password for entry ${vaultEntry._id}:`, err);
      }
    }

    // 4. Perform database updates
    for (const item of reEncryptedEntries) {
      item.entry.password = item.newPassword;
      await item.entry.save();
    }

    // 5. Update MasterKeyEntry verification token
    const encryptedNewToken = encryptText('Pass-up@2026', newMasterKey);
    entry.masterkeyencrypt = encryptedNewToken;
    await entry.save();

    res.json({ status: 'success', message: 'Master key updated successfully.' });
  } catch (error) {
    console.error("Update master key error:", error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error.' });
  }
});

export default router;
