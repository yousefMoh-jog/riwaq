import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";

export const BCRYPT_ROUNDS = 10;

export function getJwtSecret() {
  const secret = (process.env.JWT_SECRET ?? "").trim();
  if (!secret) throw new Error("JWT_SECRET غير مضبوط في السيرفر");
  return secret;
}

// Returns DEV_OTP when set (dev convenience), otherwise a random 4-digit code.
export function generateOtp() {
  if (process.env.DEV_OTP) return process.env.DEV_OTP;
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function normalizeLibyaPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("2189") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("002189") && digits.length === 14)
    return `+${digits.slice(2)}`;
  if (digits.startsWith("09") && digits.length === 10)
    return `+218${digits.slice(1)}`;
  return null;
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role ?? "STUDENT" },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: "refresh" }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, password_hash, phone_e164, role, educational_level, created_at FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, password_hash, phone_e164, role, educational_level, created_at FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

export async function createUser(
  fullName,
  email,
  passwordHash,
  phoneE164,
  educationalLevel = "secondary"
) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone_e164, role, educational_level, updated_at)
       VALUES ($1, $2, $3, $4, 'STUDENT', $5, CURRENT_TIMESTAMP)
       RETURNING id, full_name, email, password_hash, phone_e164, role, educational_level, created_at`,
      [fullName || "", email, passwordHash, phoneE164, educationalLevel]
    );
    return rows[0];
  } catch (err) {
    if (err.code === "23505") return findUserByEmail(email);
    throw err;
  }
}
