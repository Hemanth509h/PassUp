import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const vaultEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  url: { type: String },
  username: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  notes: { type: String },
  tags: [{ type: String }],
  strength: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const VaultEntry = mongoose.model('VaultEntry', vaultEntrySchema);

export { User, VaultEntry };
