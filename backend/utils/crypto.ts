import crypto from "crypto";

export function encryptText(text: string, masterKey: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, "sha256");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]).toString("base64");
}

export function decryptText(encryptedBase64: string, masterKey: string): string {
  try {
    const combined = Buffer.from(encryptedBase64, "base64");

    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 28);
    const authTag = combined.subarray(28, 44);
    const encryptedData = combined.subarray(44);

    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, "sha256");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Invalid Master Key or corrupted data");
  }
}
