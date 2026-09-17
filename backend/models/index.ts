import mongoose, { Document, Model, Schema, Types } from "mongoose";

export { default as User } from "./User.js";
export type { IUser } from "./User.js";
export { VaultStore } from "./VaultStore.js";
export type { VaultCategory, VaultEntryRecord } from "./VaultStore.js";
export {
  VaultEntry,
  upsertMongoEntry,
  deleteMongoEntry,
  deleteAllMongoEntries,
  listMongoEntries,
  mongoDocToRecord,
} from "./MongoVault.js";
export type { IVaultEntry } from "./MongoVault.js";

/**
 * Master Key verifier only — stores ciphertext of a known challenge string.
 * The Master Key itself is NEVER persisted in MongoDB or SQLite.
 */
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

export const MasterKeyEntry: Model<IMasterKeyEntry> =
  mongoose.models.MasterKeyEntry ||
  mongoose.model<IMasterKeyEntry>("MasterKeyEntry", masterKeySchema);

export const RecoveryKit: Model<IRecoveryKit> =
  mongoose.models.RecoveryKit ||
  mongoose.model<IRecoveryKit>("RecoveryKit", recoveryKitSchema);
