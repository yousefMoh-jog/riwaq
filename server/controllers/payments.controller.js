import { pool } from "../config/db.js";

// Helper: generate a UUID via Postgres (avoids any Node crypto dependency)
async function genId() {
  const { rows } = await pool.query("SELECT gen_random_uuid()::text AS id");
  return rows[0].id;
}

// Shared enrollment + order logic
async function processEnrollment(userId, courseId) {
  console.log("ENROLLING USER:", userId, "IN COURSE:", courseId);

  const { rows: courseRows } = await pool.query(
    "SELECT id, title_ar, price FROM courses WHERE id = $1",
    [courseId]
  );
  if (courseRows.length === 0) {
    return { ok: false, status: 404, messageAr: "الدورة غير موجودة" };
  }
  const course = courseRows[0];

  const { rows: existing } = await pool.query(
    "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );
  if (existing.length > 0) {
    console.log("Already enrolled — returning success.");
    return { ok: true, alreadyEnrolled: true, courseId, messageAr: "أنت مسجّل في هذه الدورة بالفعل" };
  }

  // Insert order — provide explicit id to avoid missing-default issues
  const orderId = await genId();
  await pool.query(
    `INSERT INTO orders (id, user_id, course_id, total_amount, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'paid', NOW(), NOW())`,
    [orderId, userId, courseId, course.price]
  );

  // Insert enrollment — provide explicit id
  const enrollId = await genId();
  await pool.query(
    `INSERT INTO enrollments (id, user_id, course_id, enrolled_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, course_id) DO NOTHING`,
    [enrollId, userId, courseId]
  );

  console.log("Enrollment created. orderId:", orderId, "enrollId:", enrollId);

  return {
    ok: true,
    orderId,
    courseId,
    courseName: course.title_ar,
    amount: course.price,
    messageAr: "تمت عملية الدفع بنجاح",
  };
}

export async function mockPay(req, res) {
  try {
    const courseId = (req.body?.courseId ?? "").toString().trim();
    if (!courseId) {
      return res.status(400).json({ ok: false, messageAr: "معرف الدورة مطلوب" });
    }
    const result = await processEnrollment(req.auth.userId, courseId);
    if (!result.ok) return res.status(result.status ?? 500).json(result);
    return res.json(result);
  } catch (err) {
    console.error("[payments] mockPay error:", err.message);
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ أثناء معالجة الدفع" });
  }
}

// POST /payments/confirm  — used by CheckoutPage
export async function confirm(req, res) {
  try {
    const courseId = (req.body?.courseId ?? "").toString().trim();
    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }
    const userId = req.auth.userId;

    console.log("ENROLLING USER:", userId, "IN COURSE:", courseId);

    // Verify course exists
    const { rows } = await pool.query("SELECT id FROM courses WHERE id = $1", [courseId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check already enrolled
    const { rows: existing } = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (existing.length > 0) {
      console.log("User already enrolled — returning success.");
      return res.json({ success: true, message: "Already enrolled" });
    }

    // Fetch course price for order record
    const { rows: courseRows } = await pool.query(
      "SELECT price FROM courses WHERE id = $1",
      [courseId]
    );
    const coursePrice = courseRows[0]?.price ?? 0;

    // Insert order record for revenue tracking
    const orderId = await genId();
    await pool.query(
      `INSERT INTO orders (id, user_id, course_id, total_amount, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'paid', NOW(), NOW())`,
      [orderId, userId, courseId, coursePrice]
    );

    // Insert enrollment with explicit id
    const enrollId = await genId();
    await pool.query(
      `INSERT INTO enrollments (id, user_id, course_id, enrolled_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [enrollId, userId, courseId]
    );

    console.log("Enrollment created. orderId:", orderId, "enrollId:", enrollId);
    return res.json({ success: true, message: "Payment simulated successfully" });
  } catch (err) {
    console.error("[payments] confirm error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Alias kept for backward compatibility
export async function fakeSuccess(req, res) {
  try {
    const courseId = (req.body?.courseId ?? "").toString().trim();
    if (!courseId) {
      return res.status(400).json({ ok: false, messageAr: "معرف الدورة مطلوب" });
    }
    const result = await processEnrollment(req.auth.userId, courseId);
    if (!result.ok) return res.status(result.status ?? 500).json(result);
    return res.json(result);
  } catch (err) {
    console.error("[payments] fakeSuccess error:", err.message);
    return res.status(500).json({ ok: false, messageAr: "حدث خطأ أثناء معالجة الدفع" });
  }
}
