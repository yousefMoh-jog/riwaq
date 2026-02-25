import jwt from "jsonwebtoken";
import { getJwtSecret } from "../services/auth.service.js";
import { pool } from "../config/db.js";

export async function authMiddleware(req, res, next) {
  try {
    const raw = req.headers?.authorization ?? "";
    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ messageAr: "غير مصرح" });
    const payload = jwt.verify(match[1].trim(), getJwtSecret());
    req.auth = { userId: payload.sub, role: payload.role ?? "STUDENT" };
    next();
  } catch {
    return res.status(401).json({ messageAr: "غير مصرح" });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const raw = req.headers?.authorization ?? "";
    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ messageAr: "غير مصرح" });
    const payload = jwt.verify(match[1].trim(), getJwtSecret());
    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ messageAr: "غير مصرح - يتطلب صلاحيات المدير" });
    }
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ messageAr: "غير مصرح" });
  }
}

// Allows ADMIN and INSTRUCTOR roles
export async function requireInstructor(req, res, next) {
  try {
    const raw = req.headers?.authorization ?? "";
    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ messageAr: "غير مصرح" });
    const payload = jwt.verify(match[1].trim(), getJwtSecret());
    if (payload.role !== "ADMIN" && payload.role !== "INSTRUCTOR") {
      return res
        .status(403)
        .json({ messageAr: "غير مصرح - يتطلب صلاحيات المدرس أو المدير" });
    }
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ messageAr: "غير مصرح" });
  }
}

export async function requireEnrollment(req, res, next) {
  try {
    const raw = req.headers?.authorization ?? "";
    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ messageAr: "يجب تسجيل الدخول" });

    const payload = jwt.verify(match[1].trim(), getJwtSecret());
    const userId = payload.sub;
    const courseId = req.params.courseId || req.params.id;

    if (!courseId) {
      return res.status(400).json({ messageAr: "معرف الدورة مطلوب" });
    }

    const { rows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    req.auth = { userId, role: payload.role ?? "STUDENT" };
    req.enrollmentVerified = true;
    next();
  } catch {
    return res.status(401).json({ messageAr: "غير مصرح" });
  }
}

export async function requireEnrollmentForSection(req, res, next) {
  try {
    const raw = req.headers?.authorization ?? "";
    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ messageAr: "يجب تسجيل الدخول" });

    const payload = jwt.verify(match[1].trim(), getJwtSecret());
    const userId = payload.sub;
    const sectionId = req.params.sectionId;

    if (!sectionId) {
      return res.status(400).json({ messageAr: "معرف القسم مطلوب" });
    }

    const { rows: sectionRows } = await pool.query(
      "SELECT course_id FROM sections WHERE id = $1",
      [sectionId]
    );

    if (sectionRows.length === 0) {
      return res.status(404).json({ messageAr: "القسم غير موجود" });
    }

    const courseId = sectionRows[0].course_id;

    const { rows: enrollmentRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );

    if (enrollmentRows.length === 0) {
      return res.status(403).json({ messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    req.auth = { userId, role: payload.role ?? "STUDENT" };
    req.courseId = courseId;
    next();
  } catch {
    return res.status(401).json({ messageAr: "غير مصرح" });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const raw = req.headers?.authorization ?? "";
    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (match) {
      const payload = jwt.verify(match[1].trim(), getJwtSecret());
      req.auth = { userId: payload.sub, role: payload.role ?? "STUDENT" };
    }
    next();
  } catch {
    next();
  }
}
