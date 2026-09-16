import mongoose, { Document, Model, Schema, Types } from "mongoose";

export { default as User } from "./User.js";
export type { IUser } from "./User.js";

export interface IVaultEntry extends Document {
  userId: Types.ObjectId;
  entryID: string;
  title: string;
  url?: string;
  username?: string;
  email?: string;
  password: string;
  notes?: string;
  tags: string[];
  strength?: string;
  createdAt: Date;
}

export interface IMasterKeyEntry extends Document {
  userId: Types.ObjectId;
  masterkeyencrypt?: string;
}

const vaultEntrySchema = new Schema<IVaultEntry>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  entryID: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String },
  username: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  notes: { type: String },
  tags: [{ type: String }],
  strength: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const masterKeySchema = new Schema<IMasterKeyEntry>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  masterkeyencrypt: { type: String },
});

export const VaultEntry: Model<IVaultEntry> =
  mongoose.models.VaultEntry ||
  mongoose.model<IVaultEntry>("VaultEntry", vaultEntrySchema);

export const MasterKeyEntry: Model<IMasterKeyEntry> =
  mongoose.models.MasterKeyEntry ||
  mongoose.model<IMasterKeyEntry>("MasterKeyEntry", masterKeySchema);
