import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  passwordHash?: string;
  salt?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
    },
    passwordHash: {
      type: String,
    },
    salt: {
      type: String,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;
  // If already hashed with bcrypt, do not re-hash
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidate: string,
): Promise<boolean> {
  if (!candidate || typeof candidate !== "string") return false;

  // 1. Primary password field
  if (this.password && typeof this.password === "string") {
    // Bcrypt hash
    if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
      try {
        return await bcrypt.compare(candidate, this.password);
      } catch {
        return false;
      }
    }

    // Legacy format "salt:hash"
    if (this.password.includes(":")) {
      const [salt, originalHash] = this.password.split(":");
      const hash = crypto
        .pbkdf2Sync(candidate, salt, 1000, 64, "sha512")
        .toString("hex");
      if (hash === originalHash) {
        // Upgrade to bcrypt
        this.password = await bcrypt.hash(candidate, 12);
        await this.save();
        return true;
      }
      return false;
    }

    // Fallback bcrypt compare
    try {
      return await bcrypt.compare(candidate, this.password);
    } catch {
      return false;
    }
  }

  // 2. Legacy passwordHash field
  if (this.passwordHash && typeof this.passwordHash === "string") {
    if (this.passwordHash.startsWith("$2a$") || this.passwordHash.startsWith("$2b$")) {
      try {
        const matches = await bcrypt.compare(candidate, this.passwordHash);
        if (matches) {
          this.password = this.passwordHash;
          await this.save();
          return true;
        }
      } catch {
        return false;
      }
    }

    if (this.salt) {
      for (const iter of [1000, 10000, 100000]) {
        for (const digest of ["sha512", "sha256"]) {
          const hash = crypto
            .pbkdf2Sync(candidate, this.salt, iter, 64, digest)
            .toString("hex");
          if (hash === this.passwordHash) {
            this.password = await bcrypt.hash(candidate, 12);
            await this.save();
            return true;
          }
        }
      }
    }
  }

  return false;
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
