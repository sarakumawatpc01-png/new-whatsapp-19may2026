import jwt, { type JwtPayload as JwtPayloadType } from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Use bcryptjs for Windows compatibility
import { getEnv } from "@repo/config";

export type JwtPayload = {
  sub: string;
  tenant_id?: string;
  role: string;
  sessionId?: string;
};

export const generateToken = (payload: JwtPayload) => {
  const env = getEnv();
  const privateKey = env.JWT_PRIVATE_KEY;
  
  if (privateKey && privateKey.includes("BEGIN PRIVATE KEY")) {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: "15m" });
  }
  
  console.warn("⚠️ JWT_PRIVATE_KEY not found or invalid. Falling back to HS256 for development.");
  return jwt.sign(payload, env.JWT_SECRET || "default-secret", { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  const env = getEnv();
  const privateKey = env.JWT_PRIVATE_KEY;
  
  if (privateKey && privateKey.includes("BEGIN PRIVATE KEY")) {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: "30d" });
  }
  
  return jwt.sign(payload, env.JWT_REFRESH_SECRET || "default-refresh-secret", { expiresIn: "30d" });
};

export const verifyToken = (token: string, isRefresh = false) => {
  const env = getEnv();
  const publicKey = env.JWT_PUBLIC_KEY;
  const secret = isRefresh ? (env.JWT_REFRESH_SECRET || "default-refresh-secret") : (env.JWT_SECRET || "default-secret");

  if (publicKey && publicKey.includes("BEGIN PUBLIC KEY")) {
    try {
      return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
    } catch (e) {
      if (!isRefresh) {
         // If it failed as RS256, it might be an old HS256 token during transition or dev
         try { return jwt.verify(token, secret) as JwtPayload; } catch {}
      }
      throw e;
    }
  }

  return jwt.verify(token, secret) as JwtPayload;
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};
