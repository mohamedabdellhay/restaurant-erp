import bcrypt from "bcryptjs";
import { bcryptConfig } from "../config/jwt.js";

export async function hashPassword(plain) {
  if (!plain) return plain;
  if (typeof plain === "string" && plain.startsWith("$2")) return plain;
  return bcrypt.hash(plain, bcryptConfig.saltRounds);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
