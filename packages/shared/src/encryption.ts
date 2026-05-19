import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_SIZE = 16;

const normalizeKeyHex = (rawKey?: string): string => {
  const key = (rawKey || "").trim();
  if (key.length >= 64) {
    return key.slice(0, 64);
  }
  return key.padEnd(64, "0");
};

export const getEncryptionKey = (rawKey?: string): Buffer => {
  return Buffer.from(normalizeKeyHex(rawKey), "hex");
};

export const encryptWithKey = (text: string, key: Buffer): string => {
  const iv = crypto.randomBytes(IV_SIZE);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptWithKey = (text: string, key: Buffer): string => {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const createEncryptor = (rawKey?: string) => {
  const key = getEncryptionKey(rawKey);
  return {
    encrypt: (text: string) => encryptWithKey(text, key),
    decrypt: (text: string) => decryptWithKey(text, key),
  };
};
