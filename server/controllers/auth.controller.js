import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import {
  BCRYPT_ROUNDS,
  generateOtp,
  normalizeLibyaPhone,
  signAccessToken,
  signRefreshToken,
  findUserByEmail,
  findUserById,
  createUser,
} from "../services/auth.service.js";

export async function requestOtp(req, res) {
  try {
    const fullName = (req.body?.fullName ?? "").toString().trim();
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    const password = (req.body?.password ?? "").toString();
    const phoneRaw = (req.body?.phone ?? "").toString();
    const educationalLevel = (
      req.body?.educationalLevel ?? "secondary"
    )
      .toString()
      .trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "البريد الإلكتروني غير صالح" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({
        ok: false,
        messageAr: "كلمة المرور يجب أن تكون على الأقل 8 أحرف",
      });
    }
    const phoneE164 = normalizeLibyaPhone(phoneRaw);
    if (!phoneE164) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "رقم الهاتف الليبي غير صالح" });
    }

    const existingUser = await findUserByEmail(email);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    if (existingUser) {
      const match = await bcrypt.compare(password, existingUser.password_hash);
      if (!match) {
        return res
          .status(400)
          .json({ ok: false, messageAr: "كلمة المرور غير صحيحة" });
      }
    } else {
      if (fullName.length < 2) {
        return res.status(400).json({
          ok: false,
          messageAr: "الاسم الكامل يجب أن يكون حرفين على الأقل",
        });
      }
      if (!["preparatory", "secondary", "university"].includes(educationalLevel)) {
        return res
          .status(400)
          .json({ ok: false, messageAr: "المستوى التعليمي غير صالح" });
      }
    }

    await pool.query(
      "DELETE FROM otp_codes WHERE phone = $1 AND email = $2",
      [phoneE164, email]
    );

    const otpCode = generateOtp();
    await pool.query(
      `INSERT INTO otp_codes (phone, email, full_name, password_hash, educational_level, code, used, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW() + INTERVAL '30 minutes')`,
      [phoneE164, email, fullName, passwordHash, educationalLevel, otpCode]
    );

    return res.json({ ok: true });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const phoneRaw = (req.body?.phone ?? "").toString();
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    const code = (req.body?.code ?? "").toString().trim();

    const phoneE164 = normalizeLibyaPhone(phoneRaw);
    if (!phoneE164)
      return res
        .status(400)
        .json({ ok: false, messageAr: "رقم الهاتف الليبي غير صالح" });
    if (!email)
      return res
        .status(400)
        .json({ ok: false, messageAr: "البريد الإلكتروني مطلوب" });
    if (!/^\d{4,6}$/.test(code))
      return res.status(400).json({
        ok: false,
        messageAr: "رمز التحقق يجب أن يكون 4 إلى 6 أرقام",
      });

    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND email = $2 AND code = $3 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phoneE164, email, code]
    );

    const otpRow = rows[0];
    if (!otpRow) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "رمز التحقق غير صالح أو منتهي" });
    }

    await pool.query("UPDATE otp_codes SET used = true WHERE id = $1", [
      otpRow.id,
    ]);

    let user = await findUserByEmail(email);
    if (!user) {
      const fullName = otpRow.full_name ?? "";
      const passwordHash = otpRow.password_hash ?? "";
      const educationalLevel = otpRow.educational_level ?? "secondary";
      if (!fullName || !passwordHash) {
        return res.status(400).json({
          ok: false,
          messageAr: "بيانات التسجيل غير مكتملة. أعد طلب الرمز.",
        });
      }
      user = await createUser(
        fullName,
        email,
        passwordHash,
        phoneE164,
        educationalLevel
      );
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone_e164,
        fullName: user.full_name,
        email: user.email,
        role: user.role ?? "user",
        educationalLevel: user.educational_level ?? "secondary",
      },
    });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getMe(req, res) {
  try {
    const user = await findUserById(req.auth.userId);
    if (!user) return res.status(401).json({ messageAr: "غير مصرح" });
    return res.status(200).json({
      id: user.id,
      phone: user.phone_e164,
      fullName: user.full_name,
      email: user.email,
      role: user.role ?? "user",
      educationalLevel: user.educational_level ?? "secondary",
      createdAt: user.created_at,
    });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function changePassword(req, res) {
  try {
    const currentPassword = (req.body?.currentPassword ?? "").toString();
    const newPassword = (req.body?.newPassword ?? "").toString();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        messageAr: "كلمة المرور الحالية والجديدة مطلوبة",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        ok: false,
        messageAr: "كلمة المرور الجديدة يجب أن تكون على الأقل 8 أحرف",
      });
    }

    const user = await findUserById(req.auth.userId);
    if (!user) return res.status(401).json({ messageAr: "غير مصرح" });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({
        ok: false,
        messageAr: "كلمة المرور الحالية غير صحيحة",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newPasswordHash, user.id]
    );

    return res.json({ ok: true, messageAr: "تم تغيير كلمة المرور بنجاح" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}
