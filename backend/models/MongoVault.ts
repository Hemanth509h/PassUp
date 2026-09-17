import crypto from "crypto";
import mongoose, { Model, Schema, Types } from "mongoose";

import type { VaultCategory, VaultEntryRecord } from "./VaultStore.js";

/**
 * Durable cloud copy of vault entries (ciphertext only).
 * SQLite is the fast local cache; MongoDB is the durable store.
 * Master Key is NEVER stored here.
 */
export interface IVaultEntry {
  _id: string;
  userId: Types.ObjectId;
  entryID: string;
  title: string;
  category: VaultCategory;
  url?: string;
  username?: string;
  email?: string;
  password: string;
  notes?: string;
  tags: string[];
  strength?: string;
  favorite: boolean;
  cardDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vaultEntrySchema = new Schema<IVaultEntry>(
  {
    _id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entryID: {
      type: String,
      required: true,
      default: () => crypto.randomUUID(),
    },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["login", "card", "api_key", "note"],
      default: "login",
    },
    url: { type: String },
    username: { type: String },
    email: { type: String },
    password: { type: String, required: true },
    notes: { type: String },
    tags: [{ type: String }],
    strength: { type: String },
    favorite: { type: Boolean, default: false },
    cardDetails: { type: String },
  },
  { timestamps: true, _id: false },
);

vaultEntrySchema.index({ userId: 1, entryID: 1 }, { unique: true });

export const VaultEntry: Model<IVaultEntry> =
  mongoose.models.VaultEntry ||
  mongoose.model<IVaultEntry>("VaultEntry", vaultEntrySchema);

export function mongoDocToRecord(doc: IVaultEntry): VaultEntryRecord {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    entryID: doc.entryID,
    title: doc.title,
    category: doc.category,
    url: doc.url,
    username: doc.username,
    email: doc.email,
    password: doc.password,
    notes: doc.notes,
    tags: doc.tags || [],
    strength: doc.strength,
    favorite: Boolean(doc.favorite),
    cardDetails: doc.cardDetails,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt),
  };
}

export async function upsertMongoEntry(record: VaultEntryRecord): Promise<void> {
  await VaultEntry.findOneAndUpdate(
    { _id: record._id, userId: record.userId },
    {
      _id: record._id,
      userId: record.userId,
      entryID: record.entryID,
      title: record.title,
      category: record.category,
      url: record.url,
      username: record.username,
      email: record.email,
      password: record.password,
      notes: record.notes,
      tags: record.tags || [],
      strength: record.strength,
      favorite: Boolean(record.favorite),
      cardDetails: record.cardDetails,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, timestamps: false },
  );
}

export async function deleteMongoEntry(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await VaultEntry.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}

export async function deleteAllMongoEntries(userId: string): Promise<number> {
  const result = await VaultEntry.deleteMany({ userId });
  return result.deletedCount || 0;
}

export async function listMongoEntries(
  userId: string,
): Promise<VaultEntryRecord[]> {
  const docs = await VaultEntry.find({ userId }).sort({ createdAt: -1 });
  return docs.map(mongoDocToRecord);
}
