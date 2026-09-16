import crypto from "crypto";
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export { default as User } from "./User.js";
export type { IUser } from "./User.js";

export type VaultCategory = "login" | "card" | "api_key" | "note";

export interface IVaultEntry extends Document {
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
  updatedAt?: Date;
}

export interface IMasterKeyEntry extends Document {
  userId: Types.ObjectId;
  masterkeyencrypt?: string;
}

export interface IRecoveryKit extends Document {
  userId: Types.ObjectId;
  enabled: boolean;
  totpSecret: string;
  backupCodes: string[];
  recoverySeedWords: string[];
  seedHash: string;
  lastVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vaultEntrySchema = new Schema<IVaultEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    entryID: {
      type: String,
      required: true,
      unique: true,
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
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const masterKeySchema = new Schema<IMasterKeyEntry>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  masterkeyencrypt: { type: String },
});

const recoveryKitSchema = new Schema<IRecoveryKit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    enabled: { type: Boolean, default: true },
    totpSecret: { type: String, required: true },
    backupCodes: [{ type: String }],
    recoverySeedWords: [{ type: String }],
    seedHash: { type: String, required: true },
    lastVerifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const VaultEntry: Model<IVaultEntry> =
  mongoose.models.VaultEntry ||
  mongoose.model<IVaultEntry>("VaultEntry", vaultEntrySchema);

export const MasterKeyEntry: Model<IMasterKeyEntry> =
  mongoose.models.MasterKeyEntry ||
  mongoose.model<IMasterKeyEntry>("MasterKeyEntry", masterKeySchema);

export const RecoveryKit: Model<IRecoveryKit> =
  mongoose.models.RecoveryKit ||
  mongoose.model<IRecoveryKit>("RecoveryKit", recoveryKitSchema);
