import { pool } from "../config/db.js";
import { startBunnyPolling } from "../services/bunny.service.js";
import { createHash } from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { existsSync, mkdirSync, createReadStream, unlinkSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const THUMBNAILS_DIR = join(__dirname, "..", "..", "uploads", "thumbnails");
if (!existsSync(THUMBNAILS_DIR)) mkdirSync(THUMBNAILS_DIR, { recursive: true });

const TEMP_VIDEO_DIR = join(__dirname, "..", "..", "uploads", "temp");
if (!existsSync(TEMP_VIDEO_DIR)) mkdirSync(TEMP_VIDEO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: THUMBNAILS_DIR,
  filename: (_req, file, cb) =>
    cb(null, `thumb-${Date.now()}${extname(file.originalname)}`),
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

export const thumbnailUpload = multerUpload.single("thumbnail");

// Video upload — disk storage so large files don't blow up RAM
const videoMulter = multer({
  storage: multer.diskStorage({
    destination: TEMP_VIDEO_DIR,
    filename: (_req, _file, cb) =>
      cb(null, `vid-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) return cb(null, true);
    cb(new Error("Only video files are allowed"));
  },
});
export const videoUploadMiddleware = videoMulter.single("video");

const ATTACHMENTS_DIR = join(__dirname, "..", "..", "uploads", "attachments");
if (!existsSync(ATTACHMENTS_DIR)) mkdirSync(ATTACHMENTS_DIR, { recursive: true });

const attachmentStorage = multer.diskStorage({
  destination: ATTACHMENTS_DIR,
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `attachment-${Date.now()}${ext}`);
  },
});
export const attachmentUploadMiddleware = multer({
  storage: attachmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single("attachment");

export async function uploadAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, messageAr: "لم يتم رفع أي ملف" });
  }
  const lessonId = req.params.id;
  const url = `/uploads/attachments/${req.file.filename}`;

  try {
    const { rows } = await pool.query(
      "UPDATE lessons SET attachment_url = $1 WHERE id = $2 RETURNING id",
      [url, lessonId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, messageAr: "الدرس غير موجود" });
    }
    return res.json({ ok: true, url });
  } catch (err) {
    console.error("uploadAttachment error:", err);
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getUsers(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email, educational_level, role, created_at FROM users ORDER BY created_at DESC"
    );
    return res.json({ users: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getStats(req, res) {
  try {
    const { rows: usersCount } = await pool.query(
      "SELECT COUNT(*) as count FROM users"
    );
    const { rows: coursesCount } = await pool.query(
      "SELECT COUNT(*) as count FROM courses"
    );
    // Count unique enrolled students (source of truth: enrollments table)
    const { rows: studentsCount } = await pool.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM enrollments"
    );
    // Revenue = sum of course prices for every confirmed enrollment
    const { rows: revenue } = await pool.query(
      `SELECT COALESCE(SUM(c.price), 0) AS total
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id`
    );
    // 5 most recent sales with student + course details
    const { rows: recentSales } = await pool.query(
      `SELECT
         e.id,
         u.full_name   AS student_name,
         u.email       AS student_email,
         c.title_ar    AS course_title,
         c.price,
         e.enrolled_at AS purchase_date
       FROM enrollments e
       LEFT JOIN users   u ON e.user_id   = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       ORDER BY e.enrolled_at DESC
       LIMIT 5`
    );
    // Today's sales (enrollments since midnight local server time)
    const { rows: todayRows } = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(c.price), 0) AS revenue
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.enrolled_at >= CURRENT_DATE`
    );
    return res.json({
      totalUsers:    parseInt(usersCount[0].count),
      totalCourses:  parseInt(coursesCount[0].count),
      totalStudents: parseInt(studentsCount[0].count),
      totalRevenue:  parseFloat(revenue[0].total),
      recentSales,
      todaySales: {
        count:   parseInt(todayRows[0].count),
        revenue: parseFloat(todayRows[0].revenue),
      },
    });
  } catch (err) {
    console.error("[getStats] error:", err);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getCategories(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name_ar FROM categories ORDER BY created_at DESC"
    );
    return res.json({ categories: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export function uploadThumbnail(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, messageAr: "لم يتم رفع أي صورة" });
  }
  const url = `/uploads/thumbnails/${req.file.filename}`;
  return res.json({ ok: true, url });
}

export async function getCourses(req, res) {
  try {
    const { userId, role } = req.auth;
    let query, params;
    if (role === "INSTRUCTOR") {
      query = `SELECT id, category_id, title_ar as title, description_ar as description, price, educational_level, instructor_id, published, thumbnail_url, created_at
               FROM courses WHERE instructor_id = $1 ORDER BY created_at DESC`;
      params = [userId];
    } else {
      query = `SELECT id, category_id, title_ar as title, description_ar as description, price, educational_level, instructor_id, published, thumbnail_url, created_at
               FROM courses ORDER BY created_at DESC`;
      params = [];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ courses: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function createCourse(req, res) {
  try {
    const title = (req.body?.title ?? "").toString().trim();
    const description = (req.body?.description ?? "").toString().trim();
    const price = (req.body?.price ?? "0").toString().trim();
    const educationalLevel = (req.body?.educationalLevel ?? "secondary").toString().trim();
    const categoryId = (req.body?.categoryId ?? "").toString().trim();
    const thumbnailUrl = (req.body?.thumbnailUrl ?? "").toString().trim() || null;
    const published = req.body?.published !== false && req.body?.published !== "false";

    if (!title || title.length < 3) {
      return res.status(400).json({ ok: false, messageAr: "عنوان الدورة يجب أن يكون 3 أحرف على الأقل" });
    }
    if (!["preparatory", "secondary", "university"].includes(educationalLevel)) {
      return res.status(400).json({ ok: false, messageAr: "المستوى التعليمي غير صالح" });
    }
    if (!categoryId) {
      return res.status(400).json({ ok: false, messageAr: "يجب اختيار التصنيف" });
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ ok: false, messageAr: "السعر يجب أن يكون رقماً صحيحاً" });
    }

    const instructorId = req.auth?.userId ?? null;
    const { rows } = await pool.query(
      `INSERT INTO courses (id, category_id, title_ar, description_ar, price, educational_level, thumbnail_url, published, instructor_id, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [categoryId, title, description, priceNum, educationalLevel, thumbnailUrl, published, instructorId]
    );
    return res.json({ ok: true, course: rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ ok: false, messageAr: "التصنيف المحدد غير موجود" });
    }
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function updateCourse(req, res) {
  try {
    const courseId = req.params.id;

    // Instructors can only edit their own courses
    if (req.auth.role === "INSTRUCTOR") {
      const { rows: owned } = await pool.query(
        "SELECT id FROM courses WHERE id = $1 AND instructor_id = $2",
        [courseId, req.auth.userId]
      );
      if (owned.length === 0) {
        return res.status(403).json({ ok: false, messageAr: "لا يمكنك تعديل دورة لا تمتلكها" });
      }
    }

    const title = (req.body?.title ?? "").toString().trim();
    const description = (req.body?.description ?? "").toString().trim();
    const price = (req.body?.price ?? "0").toString().trim();
    const educationalLevel = (req.body?.educationalLevel ?? "secondary").toString().trim();
    const categoryId = (req.body?.categoryId ?? "").toString().trim();
    const thumbnailUrl = (req.body?.thumbnailUrl ?? "").toString().trim() || null;
    const published = req.body?.published !== false && req.body?.published !== "false";

    if (!title || title.length < 3) {
      return res.status(400).json({ ok: false, messageAr: "عنوان الدورة يجب أن يكون 3 أحرف على الأقل" });
    }
    if (!["preparatory", "secondary", "university"].includes(educationalLevel)) {
      return res.status(400).json({ ok: false, messageAr: "المستوى التعليمي غير صالح" });
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ ok: false, messageAr: "السعر يجب أن يكون رقماً صحيحاً" });
    }

    const updateFields = [
      `title_ar = $1`,
      `description_ar = $2`,
      `price = $3`,
      `educational_level = $4`,
      `published = $5`,
      `updated_at = NOW()`,
    ];
    const updateValues = [title, description, priceNum, educationalLevel, published];
    let paramCount = updateValues.length + 1;

    if (categoryId) {
      updateFields.push(`category_id = $${paramCount++}`);
      updateValues.push(categoryId);
    }
    if (thumbnailUrl !== null) {
      updateFields.push(`thumbnail_url = $${paramCount++}`);
      updateValues.push(thumbnailUrl);
    }
    updateValues.push(courseId);

    const { rows } = await pool.query(
      `UPDATE courses SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, messageAr: "الدورة غير موجودة" });
    }
    return res.json({ ok: true, course: rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ ok: false, messageAr: "التصنيف المحدد غير موجود" });
    }
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function deleteCourse(req, res) {
  try {
    const courseId = req.params.id;

    if (req.auth.role === "INSTRUCTOR") {
      const { rows: owned } = await pool.query(
        "SELECT id FROM courses WHERE id = $1 AND instructor_id = $2",
        [courseId, req.auth.userId]
      );
      if (owned.length === 0) {
        return res.status(403).json({ ok: false, messageAr: "لا يمكنك حذف دورة لا تمتلكها" });
      }
    }

    const { rows } = await pool.query(
      "DELETE FROM courses WHERE id = $1 RETURNING id",
      [courseId]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدورة غير موجودة" });
    }
    return res.json({ ok: true, messageAr: "تم حذف الدورة بنجاح" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getSections(req, res) {
  try {
    const { userId, role } = req.auth;
    let query, params;
    if (role === "INSTRUCTOR") {
      query = `SELECT s.id, s.title_ar AS title, s.course_id, s.sort_order AS order_index, c.title_ar AS course_title
               FROM sections s
               LEFT JOIN courses c ON s.course_id = c.id
               WHERE c.instructor_id = $1
               ORDER BY c.title_ar, s.sort_order`;
      params = [userId];
    } else {
      query = `SELECT s.id, s.title_ar AS title, s.course_id, s.sort_order AS order_index, c.title_ar AS course_title
               FROM sections s
               LEFT JOIN courses c ON s.course_id = c.id
               ORDER BY c.title_ar, s.sort_order`;
      params = [];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ sections: rows });
  } catch (err) {
    console.error("SECTION LIST ERROR:", err);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function createSection(req, res) {
  try {
    const title = (req.body?.title ?? "").toString().trim();
    const courseId = (req.body?.courseId ?? "").toString().trim();
    const sortOrder = parseInt(req.body?.orderIndex ?? "0");

    if (!title || title.length < 3) {
      return res.status(400).json({
        ok: false,
        messageAr: "عنوان القسم يجب أن يكون 3 أحرف على الأقل",
      });
    }
    if (!courseId) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "يجب تحديد الدورة" });
    }

    const { rows: courseRows } = await pool.query(
      "SELECT id, instructor_id FROM courses WHERE id = $1",
      [courseId]
    );
    if (courseRows.length === 0) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "الدورة غير موجودة" });
    }
    if (req.auth.role === "INSTRUCTOR" && courseRows[0].instructor_id !== req.auth.userId) {
      return res.status(403).json({ ok: false, messageAr: "لا يمكنك إضافة قسم لدورة لا تمتلكها" });
    }

    const { rows } = await pool.query(
      `INSERT INTO sections (id, course_id, title_ar, sort_order, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [courseId, title, sortOrder]
    );
    return res.json({ ok: true, section: rows[0] });
  } catch (err) {
    console.error("SECTION CREATE ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function updateSection(req, res) {
  try {
    const sectionId = req.params.id;
    const title = (req.body?.title ?? "").toString().trim();
    const courseId = (req.body?.courseId ?? "").toString().trim();
    const sortOrder = parseInt(req.body?.orderIndex ?? "0");

    if (!title || title.length < 3) {
      return res.status(400).json({
        ok: false,
        messageAr: "عنوان القسم يجب أن يكون 3 أحرف على الأقل",
      });
    }

    const { rows } = await pool.query(
      `UPDATE sections
       SET title_ar = $1, course_id = $2, sort_order = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, courseId, sortOrder, sectionId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "القسم غير موجود" });
    }
    return res.json({ ok: true, section: rows[0] });
  } catch (err) {
    console.error("SECTION UPDATE ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function deleteSection(req, res) {
  try {
    const sectionId = req.params.id;
    const { rows } = await pool.query(
      "DELETE FROM sections WHERE id = $1 RETURNING id",
      [sectionId]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "القسم غير موجود" });
    }
    return res.json({ ok: true, messageAr: "تم حذف القسم بنجاح" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getLessons(req, res) {
  try {
    const { userId, role } = req.auth;
    let query, params;
    if (role === "INSTRUCTOR") {
      query = `SELECT l.id, l.title_ar AS title, l.section_id, l.sort_order, l.duration_seconds AS duration,
                      l.attachment_url,
                      s.title_ar AS section_title, s.course_id, c.title_ar AS course_title,
                      va.status AS video_status, va.bunny_video_id
               FROM lessons l
               LEFT JOIN sections s ON l.section_id = s.id
               LEFT JOIN courses  c ON s.course_id = c.id
               LEFT JOIN video_assets va ON va.lesson_id = l.id
               WHERE c.instructor_id = $1
               ORDER BY c.title_ar, s.sort_order, l.sort_order`;
      params = [userId];
    } else {
      query = `SELECT l.id, l.title_ar AS title, l.section_id, l.sort_order, l.duration_seconds AS duration,
                      l.attachment_url,
                      s.title_ar AS section_title, s.course_id, c.title_ar AS course_title,
                      va.status AS video_status, va.bunny_video_id
               FROM lessons l
               LEFT JOIN sections s ON l.section_id = s.id
               LEFT JOIN courses  c ON s.course_id = c.id
               LEFT JOIN video_assets va ON va.lesson_id = l.id
               ORDER BY c.title_ar, s.sort_order, l.sort_order`;
      params = [];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ lessons: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function createLesson(req, res) {
  try {
    const title = (req.body?.title ?? "").toString().trim();
    const sectionId = (req.body?.sectionId ?? "").toString().trim();
    const duration = parseInt(req.body?.duration ?? "0") || 0;
    const orderIndex = parseInt(req.body?.orderIndex ?? "1") || 1;

    if (!title || title.length < 3) {
      return res.status(400).json({
        ok: false,
        messageAr: "عنوان الدرس يجب أن يكون 3 أحرف على الأقل",
      });
    }
    if (!sectionId) {
      return res.status(400).json({ ok: false, messageAr: "يجب تحديد القسم" });
    }

    // Explicitly supply all NOT NULL columns so the INSERT never depends on DB defaults
    const { rows } = await pool.query(
      `INSERT INTO lessons (id, title_ar, section_id, duration_seconds, sort_order, created_at, updated_at)
       VALUES ((uuid_generate_v4())::text, $1, $2, $3, $4, NOW(), NOW())
       RETURNING id, title_ar, section_id, duration_seconds, sort_order, created_at`,
      [title, sectionId, duration, orderIndex]
    );

    return res.json({ ok: true, lesson: rows[0] });
  } catch (err) {
    console.error("createLesson ERROR:", err.code, err.message);
    if (err.code === "23503") {
      return res.status(400).json({ ok: false, messageAr: "القسم المحدد غير موجود" });
    }
    return res.status(500).json({
      ok: false,
      messageAr: `فشل إنشاء الدرس: ${err.message}`,
    });
  }
}

export async function updateLesson(req, res) {
  try {
    const lessonId = req.params.id;
    const title = (req.body?.title ?? "").toString().trim();
    const sectionId = (req.body?.sectionId ?? "").toString().trim();
    const duration = parseInt(req.body?.duration ?? "0");
    const orderIndex = parseInt(req.body?.orderIndex ?? "0");

    if (!title || title.length < 3) {
      return res.status(400).json({
        ok: false,
        messageAr: "عنوان الدرس يجب أن يكون 3 أحرف على الأقل",
      });
    }

    // Build SET clause dynamically so attachment_url is only touched when sent
    const setClauses = [
      "title_ar = $1",
      "section_id = $2",
      "duration_seconds = $3",
      "sort_order = $4",
    ];
    const params = [title, sectionId, duration, orderIndex];

    const rawAttachmentUrl = req.body?.attachmentUrl;
    if (rawAttachmentUrl !== undefined) {
      // empty string → NULL (clears the attachment)
      params.push(rawAttachmentUrl === '' ? null : rawAttachmentUrl);
      setClauses.push(`attachment_url = $${params.length}`);
    }

    params.push(lessonId);
    const whereIdx = params.length;

    const { rows } = await pool.query(
      `UPDATE lessons SET ${setClauses.join(', ')} WHERE id = $${whereIdx} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدرس غير موجود" });
    }
    return res.json({ ok: true, lesson: rows[0] });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function deleteLesson(req, res) {
  try {
    const lessonId = req.params.id;
    const { rows } = await pool.query(
      "DELETE FROM lessons WHERE id = $1 RETURNING id",
      [lessonId]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدرس غير موجود" });
    }
    return res.json({ ok: true, messageAr: "تم حذف الدرس بنجاح" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

// ── Server-proxy video upload ──────────────────────────────────────────────
// The browser uploads to OUR server; we stream it to Bunny with AccessKey.
// This eliminates every CORS and signature concern — the API key never
// leaves the server, and we control the full upload pipeline.
export async function uploadVideoToLesson(req, res) {
  const lessonId = req.params.id;
  const libraryId = (process.env.BUNNY_LIBRARY_ID ?? "").trim();
  const apiKey = (process.env.BUNNY_API_KEY ?? "").trim();
  const filePath = req.file?.path;

  const cleanup = () => {
    if (filePath) {
      try { unlinkSync(filePath); } catch (_) {}
    }
  };

  if (!req.file || !filePath) {
    return res.status(400).json({ ok: false, messageAr: "لم يتم رفع أي ملف فيديو" });
  }

  try {
    if (!libraryId || !apiKey) {
      cleanup();
      return res.status(500).json({ ok: false, messageAr: "إعدادات Bunny غير مكتملة" });
    }

    // Verify lesson exists
    const { rows } = await pool.query("SELECT id FROM lessons WHERE id = $1", [lessonId]);
    if (rows.length === 0) {
      cleanup();
      return res.status(404).json({ ok: false, messageAr: "الدرس غير موجود" });
    }

    // Step 1: Create video object in Bunny Stream (server-side — no CORS)
    console.log(`[BUNNY] Creating video for lesson ${lessonId}...`);
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
        headers: { AccessKey: apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ title: `lesson-${lessonId}` }),
      }
    );

    if (!createRes.ok) {
      cleanup();
      const errText = await createRes.text();
      console.error(`[BUNNY] createVideo failed — ${createRes.status}: ${errText}`);
      return res.status(502).json({
        ok: false,
        messageAr: `فشل إنشاء الفيديو على Bunny (${createRes.status})`,
      });
    }

    const { guid: videoId } = await createRes.json();
    console.log(`[BUNNY] Video object created — videoId: ${videoId}`);

    // Step 2: Stream the temp file to Bunny (AccessKey from server, never exposed)
    const fileStream = createReadStream(filePath);
    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
          "Content-Type": req.file.mimetype || "video/mp4",
        },
        body: fileStream,
        duplex: "half", // Required for streaming body in Node 18+ native fetch
      }
    );

    cleanup(); // Remove temp file regardless of result

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[BUNNY] uploadVideo failed — ${uploadRes.status}: ${errText}`);
      return res.status(502).json({
        ok: false,
        messageAr: `فشل رفع الملف إلى Bunny (${uploadRes.status})`,
      });
    }

    console.log(`[BUNNY] Video uploaded OK — videoId: ${videoId} for lesson: ${lessonId}`);

    // Step 3: Register in DB and start processing poll.
    // Runtime logs confirmed the live video_assets table requires both `url`
    // (NOT NULL, no default) and `updated_at` (NOT NULL, no default).
    const streamUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
    await pool.query(
      `INSERT INTO video_assets (id, bunny_video_id, lesson_id, url, created_at, updated_at)
       VALUES ((uuid_generate_v4())::text, $1, $2, $3, NOW(), NOW())
       ON CONFLICT (lesson_id) DO UPDATE
         SET bunny_video_id = $1, url = $3, updated_at = NOW(), status = 'processing'`,
      [videoId, lessonId, streamUrl]
    );
    startBunnyPolling(videoId);

    return res.json({ ok: true, videoId });
  } catch (err) {
    cleanup();
    console.error("[BUNNY] uploadVideoToLesson error:", err.message);
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ أثناء رفع الفيديو" });
  }
}

export async function getVideoUploadSignature(req, res) {
  try {
    const lessonId = req.params.id;
    // .trim() removes invisible whitespace that can sneak into .env values
    const libraryId = (process.env.BUNNY_LIBRARY_ID ?? "").trim();
    const apiKey = (process.env.BUNNY_API_KEY ?? "").trim();

    if (!libraryId || !apiKey) {
      console.error("[BUNNY] Missing env vars — BUNNY_LIBRARY_ID:", !!libraryId, "BUNNY_API_KEY:", !!apiKey);
      return res.status(500).json({ ok: false, messageAr: "إعدادات Bunny غير مكتملة" });
    }

    // Diagnostic log: confirms key is loaded (shows first 8 chars only)
    console.log(
      `[BUNNY] upload-signature request — Library: ${libraryId}, Key: ${apiKey.substring(0, 8)}... (length: ${apiKey.length})`
    );

    const { rows: lessonRows } = await pool.query(
      "SELECT id FROM lessons WHERE id = $1",
      [lessonId]
    );
    if (lessonRows.length === 0) {
      return res.status(404).json({ ok: false, messageAr: "الدرس غير موجود" });
    }

    const bunnyUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
    console.log(`[BUNNY] POST ${bunnyUrl}`);
    console.log(
      `[BUNNY] Test this key independently:\n` +
      `  curl -s -o /dev/null -w "%{http_code}" -X POST "${bunnyUrl}" -H "AccessKey: ${apiKey}" -H "Content-Type: application/json" -d '{"title":"test"}'`
    );

    // Create video object in Bunny Stream
    // AccessKey header is case-sensitive — Bunny requires exactly this casing
    const bunnyRes = await fetch(bunnyUrl, {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ title: `lesson-${lessonId}` }),
    });

    if (!bunnyRes.ok) {
      const text = await bunnyRes.text();
      console.error(
        `[BUNNY] Video create FAILED — HTTP ${bunnyRes.status}\n` +
        `  Library:    ${libraryId}\n` +
        `  Key prefix: ${apiKey.substring(0, 8)}... (length: ${apiKey.length})\n` +
        `  Response:   ${text}\n` +
        `  ⚠ If 401: ensure BUNNY_API_KEY is the Library API Key from\n` +
        `    Bunny Dashboard → Stream → Library ${libraryId} → API tab\n` +
        `    (NOT the Account API Key or the Token Key)`
      );
      return res.status(502).json({
        ok: false,
        messageAr: `فشل الاتصال بخدمة الفيديو (${bunnyRes.status})`,
      });
    }

    const bunnyData = await bunnyRes.json();
    const videoId = bunnyData.guid;
    console.log(`[BUNNY] Video created OK — videoId: ${videoId}`);

    // Time-limited signature so the API key never leaves the server
    // Formula: SHA256(libraryId + apiKey + expirationTime + videoId)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // valid 1 hour
    const signature = createHash("sha256")
      .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
      .digest("hex");

    return res.json({ ok: true, libraryId, videoId, signature, expirationTime });
  } catch (err) {
    console.error("[BUNNY] getVideoUploadSignature exception:", err.message);
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function initUpload(req, res) {
  try {
    const lessonId = req.params.id;
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libraryId || !apiKey) {
      return res
        .status(500)
        .json({ ok: false, messageAr: "إعدادات Bunny غير مكتملة" });
    }

    const { rows: lessonRows } = await pool.query(
      "SELECT id FROM lessons WHERE id = $1",
      [lessonId]
    );
    if (lessonRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدرس غير موجود" });
    }

    const bunnyRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
        headers: { AccessKey: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ title: `lesson-${lessonId}` }),
      }
    );

    if (!bunnyRes.ok) {
      const err = await bunnyRes.text();
      console.error("Bunny API error:", err);
      return res
        .status(502)
        .json({ ok: false, messageAr: "فشل الاتصال بخدمة الفيديو" });
    }

    const bunnyData = await bunnyRes.json();
    const videoId = bunnyData.guid;

    return res.json({
      ok: true,
      videoId,
      uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    });
  } catch (err) {
    console.error("init-upload error:", err);
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function registerVideo(req, res) {
  try {
    const lessonId = req.params.id;
    const bunnyVideoId = (req.body?.bunnyVideoId ?? "").toString().trim();

    if (!bunnyVideoId) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "معرف الفيديو مطلوب" });
    }

    const { rows: lessonRows } = await pool.query(
      "SELECT id FROM lessons WHERE id = $1",
      [lessonId]
    );
    if (lessonRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدرس غير موجود" });
    }

    const libraryId = (process.env.BUNNY_LIBRARY_ID ?? "").trim();
    const streamUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}`;
    await pool.query(
      `INSERT INTO video_assets (id, bunny_video_id, lesson_id, url, created_at, updated_at)
       VALUES ((uuid_generate_v4())::text, $1, $2, $3, NOW(), NOW())
       ON CONFLICT (lesson_id)
       DO UPDATE SET bunny_video_id = $1, url = $3, updated_at = NOW(), status = 'processing'`,
      [bunnyVideoId, lessonId, streamUrl]
    );

    startBunnyPolling(bunnyVideoId);

    return res.json({ ok: true, messageAr: "تم تسجيل الفيديو بنجاح" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getOrders(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         e.id,
         u.full_name    AS student_name,
         u.email        AS student_email,
         c.title_ar     AS course_title,
         c.price,
         e.enrolled_at  AS purchase_date
       FROM enrollments e
       LEFT JOIN users   u ON e.user_id   = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       ORDER BY e.enrolled_at DESC`
    );
    return res.json({ orders: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function updateUserRole(req, res) {
  try {
    const targetId = req.params.id;
    const role = (req.body?.role ?? "").toString().trim();
    if (!["ADMIN", "INSTRUCTOR", "STUDENT"].includes(role)) {
      return res.status(400).json({ ok: false, messageAr: "الدور غير صالح" });
    }
    const { rows } = await pool.query(
      "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, full_name, email, role",
      [role, targetId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, messageAr: "المستخدم غير موجود" });
    }
    return res.json({ ok: true, user: rows[0] });
  } catch {
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function updateOrder(req, res) {
  try {
    const orderId = req.params.id;
    const status = (req.body?.status ?? "").toString().trim();

    if (!["pending", "paid", "cancelled"].includes(status)) {
      return res
        .status(400)
        .json({ ok: false, messageAr: "الحالة غير صالحة" });
    }

    const { rows: orderRows } = await pool.query(
      "SELECT user_id, course_id, status FROM orders WHERE id = $1",
      [orderId]
    );
    if (orderRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الطلب غير موجود" });
    }

    const order = orderRows[0];
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      orderId,
    ]);

    if (status === "paid" && order.status !== "paid") {
      await pool.query(
        `INSERT INTO enrollments (user_id, course_id, enrolled_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, course_id) DO NOTHING`,
        [order.user_id, order.course_id]
      );
    }

    return res.json({ ok: true, messageAr: "تم تحديث حالة الطلب" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}
