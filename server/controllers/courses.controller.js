import { randomUUID } from "crypto";
import { pool } from "../config/db.js";
import { generateSignedUrl, generateSignedEmbedUrl } from "../services/bunny.service.js";

export async function getCourses(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.id,
        c.title_ar as title,
        c.description_ar as description,
        c.price,
        c.thumbnail_url,
        c.educational_level,
        c.created_at,
        cat.name_ar AS category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.published = true
       ORDER BY c.created_at DESC`
    );
    return res.json({ courses: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getCourse(req, res) {
  try {
    const courseId = req.params.id;
    const userId = req.auth?.userId;

    const { rows: courseRows } = await pool.query(
      `SELECT
        c.id,
        c.title_ar as title,
        c.description_ar as description,
        c.price,
        c.educational_level,
        c.thumbnail_url,
        cat.name_ar AS category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = $1`,
      [courseId]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({ messageAr: "الدورة غير موجودة" });
    }

    const course = courseRows[0];

    let isEnrolled = false;
    if (userId) {
      const { rows: enrollmentRows } = await pool.query(
        "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
        [userId, courseId]
      );
      isEnrolled = enrollmentRows.length > 0;
    }

    const { rows: sections } = await pool.query(
      `SELECT s.id, s.title_ar AS title, s.sort_order AS order_index
       FROM sections s
       WHERE s.course_id = $1
       ORDER BY s.sort_order ASC`,
      [courseId]
    );

    let totalLessons = 0;
    const sectionsData = await Promise.all(
      sections.map(async (section) => {
        const { rows: lessonsCount } = await pool.query(
          "SELECT COUNT(*) as count FROM lessons WHERE section_id = $1",
          [section.id]
        );
        const count = parseInt(lessonsCount[0].count);
        totalLessons += count;
        return {
          id: section.id,
          title: section.title,
          orderIndex: section.order_index,
          lessonsCount: count,
        };
      })
    );

    return res.json({ ...course, sections: sectionsData, totalLessons, isEnrolled });
  } catch (err) {
    console.error('[getCourse] error:', err.message);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function checkEnrolled(req, res) {
  try {
    const courseId = req.params.id;
    const userId = req.auth.userId;
    const { rows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    return res.json({ enrolled: rows.length > 0 });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function enroll(req, res) {
  try {
    const courseId = req.params.id;
    const userId = req.auth.userId;

    const { rows: courseRows } = await pool.query(
      "SELECT id FROM courses WHERE id = $1",
      [courseId]
    );
    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدورة غير موجودة" });
    }

    await pool.query(
      "INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT (user_id, course_id) DO NOTHING",
      [userId, courseId]
    );
    return res.json({ ok: true, messageAr: "تم التسجيل في الدورة بنجاح" });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function fakePay(req, res) {
  try {
    const courseId = req.params.courseId;
    const userId = req.auth.userId;

    const { rows: courseRows } = await pool.query(
      "SELECT id, price FROM courses WHERE id = $1",
      [courseId]
    );
    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدورة غير موجودة" });
    }

    const course = courseRows[0];
    await pool.query(
      `INSERT INTO orders (user_id, course_id, total_amount, status, created_at)
       VALUES ($1, $2, $3, 'paid', NOW())`,
      [userId, courseId, course.price]
    );
    await pool.query(
      `INSERT INTO enrollments (user_id, course_id, enrolled_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [userId, courseId]
    );

    return res.json({
      ok: true,
      message: "Payment simulated successfully",
      messageAr: "تم محاكاة الدفع بنجاح",
    });
  } catch {
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getMyCourses(req, res) {
  try {
    const userId = req.auth.userId;
    const { rows } = await pool.query(
      `SELECT c.id, c.title_ar AS title, c.description_ar AS description, c.educational_level
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
      [userId]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getCourseSections(req, res) {
  try {
    const courseId = req.params.courseId;
    const { rows: sections } = await pool.query(
      `SELECT s.id, s.title_ar AS title, s.sort_order AS order_index
       FROM sections s
       WHERE s.course_id = $1
       ORDER BY s.sort_order ASC`,
      [courseId]
    );
    return res.json({ sections });
  } catch (err) {
    console.error('[getCourseSections] error:', err.message);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getSectionLessons(req, res) {
  try {
    const sectionId = req.params.sectionId;
    const { rows: lessons } = await pool.query(
      `SELECT l.id,
              l.title_ar         AS title,
              l.duration_seconds AS duration,
              l.sort_order       AS order_index,
              l.section_id
       FROM lessons l
       WHERE l.section_id = $1
       ORDER BY l.sort_order ASC`,
      [sectionId]
    );
    return res.json({ lessons });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function getLesson(req, res) {
  try {
    const lessonId = req.params.id;
    const userId = req.auth.userId;

    const { rows: lessonRows } = await pool.query(
      `SELECT l.*, s.course_id
       FROM lessons l
       JOIN sections s ON l.section_id = s.id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return res.status(404).json({ messageAr: "الدرس غير موجود" });
    }

    const lesson = lessonRows[0];
    const courseId = lesson.course_id;

    const { rows: enrollmentRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (enrollmentRows.length === 0) {
      return res.status(403).json({ messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    const { rows: completionRows } = await pool.query(
      "SELECT completed_at FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2",
      [userId, lessonId]
    );

    return res.json({
      id: lesson.id,
      title: lesson.title_ar ?? lesson.title ?? '',
      videoUrl: lesson.video_url,
      duration: lesson.duration_seconds ?? lesson.duration ?? 0,
      orderIndex: lesson.sort_order ?? lesson.order_index ?? 0,
      sectionId: lesson.section_id,
      courseId,
      completed: completionRows.length > 0,
      completedAt: completionRows[0]?.completed_at,
    });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function completeLesson(req, res) {
  try {
    const lessonId = req.params.id;
    const userId = req.auth.userId;

    const { rows: lessonRows } = await pool.query(
      `SELECT l.id, s.course_id
       FROM lessons l
       JOIN sections s ON l.section_id = s.id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدرس غير موجود" });
    }

    const courseId = lessonRows[0].course_id;
    const { rows: enrollmentRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (enrollmentRows.length === 0) {
      return res
        .status(403)
        .json({ ok: false, messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    // Upsert: always marks the lesson as complete (idempotent).
    // ID generated in JS via randomUUID() — no uuid-ossp extension required.
    const { rows: upserted } = await pool.query(
      `INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed_at, updated_at)
       VALUES ($1, $2::uuid, $3, $4, NOW(), NOW())
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed_at = NOW(), course_id = EXCLUDED.course_id, updated_at = NOW()
       RETURNING completed_at`,
      [randomUUID(), userId, lessonId, courseId]
    );

    // Return the updated progress so the caller can refresh the UI in one round-trip
    const progress = await calculateCourseProgress(userId, courseId);
    return res.json({
      ok: true,
      completed: true,
      completedAt: upserted[0].completed_at,
      progress,
      messageAr: "تم تسجيل اكتمال الدرس",
    });
  } catch (err) {
    console.error("═══ completeLesson FATAL ERROR ═══");
    console.error("  Message   :", err.message);
    console.error("  PG Code   :", err.code);         // 42804=type mismatch, 23502=NOT NULL, 23505=UNIQUE
    console.error("  Constraint:", err.constraint);
    console.error("  Table     :", err.table);
    console.error("  Column    :", err.column);
    console.error("  Detail    :", err.detail);
    console.error("  Params    : userId=%s lessonId=%s", req.auth?.userId, req.params?.id);
    console.error("  Stack     :", err.stack);
    console.error("══════════════════════════════════");
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر", _debug: err.message, _code: err.code });
  }
}

/**
 * Calculates course progress for a user.
 *
 * NOTE: We JOIN through lessons → sections instead of filtering on
 * lesson_progress.course_id.  That column is nullable and may be NULL on
 * older rows (written before the backfill migration ran), so a plain
 * WHERE course_id = $2 would silently under-count completions and keep
 * progress stuck at 0 %.
 */
async function calculateCourseProgress(userId, courseId) {
  // Total lessons in the course
  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(l.id) AS count
     FROM lessons l
     JOIN sections s ON l.section_id = s.id
     WHERE s.course_id = $1`,
    [courseId]
  );
  const totalLessons = parseInt(totalRows[0].count, 10);

  // Completed lessons — JOIN through lessons/sections so NULL course_id rows
  // are still counted correctly.
  const { rows: completedRows } = await pool.query(
    `SELECT COUNT(*) AS count
     FROM lesson_progress lp
     JOIN lessons      l ON l.id         = lp.lesson_id
     JOIN sections     s ON s.id         = l.section_id
     WHERE lp.user_id = $1
       AND s.course_id = $2`,
    [userId, courseId]
  );
  const completedLessons = parseInt(completedRows[0].count, 10);
  const percentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  console.log(`[Progress] calculateCourseProgress userId=${userId} courseId=${courseId} → total=${totalLessons} completed=${completedLessons} (${percentage}%)`);

  if (totalLessons === 0) {
    console.warn(`[Progress] ⚠ totalLessons=0 for courseId=${courseId} — check the sections/lessons tables`);
  }

  return { totalLessons, completedLessons, percentage };
}

export async function getCourseProgress(req, res) {
  try {
    const courseId = req.params.id;
    const userId = req.auth.userId;

    console.log(`[Progress] getCourseProgress called → userId=${userId} courseId=${courseId}`);

    const { rows: enrollmentRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );

    if (enrollmentRows.length === 0) {
      console.warn(`[Progress] ⚠ getCourseProgress: user ${userId} NOT enrolled in course ${courseId}`);
      return res.json({
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        enrolled: false,
      });
    }

    const progress = await calculateCourseProgress(userId, courseId);
    return res.json({ ...progress, enrolled: true });
  } catch (err) {
    console.error("[Progress] getCourseProgress error:", err);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function toggleLessonCompletion(req, res) {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.auth.userId;

    // 1. Verify the lesson actually belongs to this course (prevents cross-course attacks)
    const { rows: lessonRows } = await pool.query(
      `SELECT l.id
       FROM lessons l
       JOIN sections s ON l.section_id = s.id
       WHERE l.id = $1 AND s.course_id = $2`,
      [lessonId, courseId]
    );
    if (lessonRows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, messageAr: "الدرس غير موجود في هذه الدورة" });
    }

    // 2. Confirm the user is enrolled
    const { rows: enrollRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (enrollRows.length === 0) {
      return res
        .status(403)
        .json({ ok: false, messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    // 3. Toggle: delete if exists, insert if not
    const { rows: existing } = await pool.query(
      "SELECT id FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2",
      [userId, lessonId]
    );

    let completed;
    let completedAt = null;

    if (existing.length > 0) {
      await pool.query(
        "DELETE FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2",
        [userId, lessonId]
      );
      completed = false;
    } else {
      // ID generated in JS — no uuid-ossp extension required.
      // ON CONFLICT guard makes the insert idempotent (handles any race condition).
      const { rows: inserted } = await pool.query(
        `INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed_at, updated_at)
         VALUES ($1, $2::uuid, $3, $4, NOW(), NOW())
         ON CONFLICT (user_id, lesson_id)
         DO UPDATE SET completed_at = NOW(), course_id = EXCLUDED.course_id, updated_at = NOW()
         RETURNING completed_at`,
        [randomUUID(), userId, lessonId, courseId]
      );
      completed = true;
      completedAt = inserted[0].completed_at;
    }

    // 4. Return updated progress + full completed-lesson list in one response
    //    so the client never has to fire a second round-trip.
    console.log(`[Progress] toggleLessonCompletion: lesson=${lessonId} course=${courseId} user=${userId} → completed=${completed}`);
    const progress = await calculateCourseProgress(userId, courseId);

    const { rows: completedRows } = await pool.query(
      `SELECT lp.lesson_id
       FROM lesson_progress lp
       JOIN lessons  l ON l.id = lp.lesson_id
       JOIN sections s ON s.id = l.section_id
       WHERE lp.user_id = $1 AND s.course_id = $2`,
      [userId, courseId]
    );
    const completedLessonIds = completedRows.map((r) => r.lesson_id);

    return res.json({ ok: true, completed, completedAt, progress, completedLessonIds });
  } catch (err) {
    console.error("═══ toggleLessonCompletion FATAL ERROR ═══");
    console.error("  Message   :", err.message);
    console.error("  PG Code   :", err.code);         // 42804=type mismatch, 23502=NOT NULL, 23505=UNIQUE
    console.error("  Constraint:", err.constraint);
    console.error("  Table     :", err.table);
    console.error("  Column    :", err.column);
    console.error("  Detail    :", err.detail);
    console.error("  Params    : userId=%s lessonId=%s courseId=%s",
      req.auth?.userId, req.params?.lessonId, req.params?.courseId);
    console.error("  Stack     :", err.stack);
    console.error("══════════════════════════════════════════");
    return res
      .status(500)
      .json({ ok: false, messageAr: "حدث خطأ في السيرفر", _debug: err.message, _code: err.code });
  }
}

// ── Public categories ──────────────────────────────────────────────────────

export async function getPublicCategories(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name_ar FROM categories ORDER BY name_ar ASC"
    );
    return res.json({ categories: rows });
  } catch {
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

// ── Course ratings ─────────────────────────────────────────────────────────

/**
 * GET /courses/:courseId/ratings
 * Public — returns all ratings for a course + average.
 */
export async function getRatings(req, res) {
  try {
    const { courseId } = req.params;

    const { rows } = await pool.query(
      `SELECT
         cr.id,
         cr.rating,
         cr.comment,
         cr.created_at,
         u.full_name AS reviewer_name
       FROM course_ratings cr
       LEFT JOIN users u ON cr.user_id = u.id
       WHERE cr.course_id = $1
       ORDER BY cr.created_at DESC`,
      [courseId]
    );

    const total = rows.length;
    const avg = total > 0
      ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : 0;

    // Distribution breakdown (1-5 stars)
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: rows.filter((r) => r.rating === star).length,
    }));

    return res.json({ ratings: rows, average: avg, total, distribution });
  } catch (err) {
    console.error("[getRatings]", err);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

/**
 * POST /courses/:courseId/ratings
 * Auth + enrolled. Upserts the rating (one per student per course).
 */
export async function submitRating(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.auth.userId;
    const rating = parseInt(req.body?.rating ?? "0");
    const comment = (req.body?.comment ?? "").toString().trim();

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, messageAr: "التقييم يجب أن يكون بين 1 و 5" });
    }

    // Must be enrolled
    const { rows: enrollRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (enrollRows.length === 0) {
      return res.status(403).json({ ok: false, messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    const { rows } = await pool.query(
      `INSERT INTO course_ratings (id, user_id, course_id, rating, comment, created_at)
       VALUES ((uuid_generate_v4())::text, $1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
       RETURNING *`,
      [userId, courseId, rating, comment || null]
    );

    return res.json({ ok: true, rating: rows[0] });
  } catch (err) {
    console.error("[submitRating]", err);
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ في السيرفر" });
  }
}

/**
 * Returns the set of lesson IDs the authenticated user has completed
 * within a given course. Used by the sidebar to show ✓ checkmarks.
 *
 * Same JOIN strategy as calculateCourseProgress — do NOT filter on
 * lesson_progress.course_id because it can be NULL on older records.
 */
export async function getCompletedLessons(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.auth.userId;
    const { rows } = await pool.query(
      `SELECT lp.lesson_id
       FROM lesson_progress lp
       JOIN lessons  l ON l.id = lp.lesson_id
       JOIN sections s ON s.id = l.section_id
       WHERE lp.user_id  = $1
         AND s.course_id = $2`,
      [userId, courseId]
    );
    const ids = rows.map((r) => r.lesson_id);
    console.log(`[Progress] getCompletedLessons userId=${userId} courseId=${courseId} → ${ids.length} completed IDs:`, ids);
    return res.json({ completedLessonIds: ids });
  } catch (err) {
    console.error("[Progress] getCompletedLessons error:", err);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}

export async function streamLesson(req, res) {
  try {
    const lessonId = req.params.id;
    const userId = req.auth.userId;

    const { rows: lessonRows } = await pool.query(
      `SELECT l.id, s.course_id,
              v.bunny_video_id, v.status AS video_status, v.url AS embed_url
       FROM lessons l
       JOIN sections s ON s.id = l.section_id
       LEFT JOIN video_assets v ON v.lesson_id = l.id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return res.status(404).json({ messageAr: "الدرس غير موجود" });
    }

    const lesson = lessonRows[0];
    const courseId = lesson.course_id;

    const { rows: enrollmentRows } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (enrollmentRows.length === 0) {
      return res.status(403).json({ messageAr: "يجب التسجيل في الدورة أولاً" });
    }

    if (!lesson.bunny_video_id) {
      return res.status(404).json({ messageAr: "الفيديو غير متوفر بعد" });
    }

    const videoId = lesson.bunny_video_id.trim();

    // Always generate a fresh signed embed URL — never use the stored plain URL
    // because Token Authentication requires a time-limited token in the query string.
    let embedUrl = null;
    try {
      embedUrl = generateSignedEmbedUrl(videoId);
    } catch (embedErr) {
      console.error("streamLesson: generateSignedEmbedUrl failed —", embedErr.message);
    }

    // Fall back to signed HLS stream if embed URL couldn't be generated
    let streamUrl = null;
    if (!embedUrl) {
      try {
        streamUrl = generateSignedUrl(videoId);
      } catch (signErr) {
        console.error("streamLesson: generateSignedUrl failed —", signErr.message);
      }
    }

    if (!embedUrl && !streamUrl) {
      return res.status(503).json({ messageAr: "رابط الفيديو غير متاح حالياً" });
    }

    console.log(`[stream] lessonId=${lessonId} videoId=${videoId}`);
    console.log(`[stream] embedUrl=${embedUrl ?? "(none)"}`);

    return res.json({ streamUrl: streamUrl ?? null, embedUrl: embedUrl ?? null });
  } catch (err) {
    console.error("streamLesson error:", err);
    return res.status(500).json({ messageAr: "حدث خطأ في السيرفر" });
  }
}
