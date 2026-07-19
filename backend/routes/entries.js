import express from 'express';
import { VaultEntry } from '../models/index.js';

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
    res.json({ status: 'success', entries });
  } catch (error) {
    console.error("Fetch entries error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /entries - Create a new entry
router.post('/entries', authenticate, async (req, res) => {
  const { title, url, username, email, password, notes, tags, strength } = req.body || {};
  if (!title || !password || (!username && !email)) {
    return res.status(400).json({ status: 'error', message: 'Title, Password, and either Username or Email are required' });
  }
  try {
    const entry = new VaultEntry({
      userId: req.userId,
      title,
      url,
      username,
      email,
      password,
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
      entry.password = password;
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

export default router;
