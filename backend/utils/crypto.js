import crypto from 'crypto';

export function encryptText(text, masterKey) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const combined = Buffer.concat([
    salt,
    iv,
    Buffer.from(authTag, 'hex'),
    Buffer.from(encrypted, 'hex')
  ]);
  return combined.toString('base64');
}

export function decryptText(encryptedBase64, masterKey) {
  try {
    const combined = Buffer.from(encryptedBase64, 'base64');
    
    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 28);
    const authTag = combined.subarray(28, 44);
    const encryptedData = combined.subarray(44);

    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Invalid Master Key or corrupted data");
  }
}
