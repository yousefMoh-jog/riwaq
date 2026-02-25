import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Runs a single DDL/DML step and logs any error without crashing the whole
// migration chain — safe for ALTER TABLE statements that may already be applied.
async function tryStep(client, label, sql) {
  try {
    await client.query(sql);
  } catch (err) {
    // Log the failure so it's visible in the terminal, then continue.
    // Most failures here are benign "already exists" situations.
    console.warn(`[DB] Step "${label}" skipped (${err.message})`);
  }
}

export async function ensureMigrations() {
  // ── 1. Verify the DB connection before doing anything else ─────────────────
  let client;
  try {
    client = await pool.connect();
    console.log("[DB] Connected to PostgreSQL successfully.");
  } catch (err) {
    console.error("[DB] ❌ Cannot connect to PostgreSQL:", err.message);
    console.error("[DB]    Check DATABASE_URL in server/.env");
    throw err;
  }

  try {
    // ── 2. Extensions ─────────────────────────────────────────────────────────
    await tryStep(client, "uuid-ossp extension", `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── 3. Core tables — ORDER MATTERS: users must exist before any FK to it ──

    // users (no foreign-key dependencies)
    await tryStep(client, "create users", `
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        full_name     TEXT,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone_e164    TEXT UNIQUE NOT NULL,
        role          TEXT NOT NULL DEFAULT 'STUDENT',
        educational_level TEXT NOT NULL DEFAULT 'secondary',
        created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // categories (no FK dependencies)
    await tryStep(client, "create categories", `
      CREATE TABLE IF NOT EXISTS categories (
        id         TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        name_ar    TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // courses (depends on categories; instructor_id FK added as a patch below)
    await tryStep(client, "create courses", `
      CREATE TABLE IF NOT EXISTS courses (
        id                TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        category_id       TEXT REFERENCES categories(id) ON DELETE SET NULL,
        title_ar          TEXT NOT NULL,
        description_ar    TEXT,
        price             NUMERIC(10,2) NOT NULL DEFAULT 0,
        educational_level TEXT NOT NULL DEFAULT 'secondary',
        thumbnail_url     TEXT,
        published         BOOLEAN NOT NULL DEFAULT true,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // sections (depends on courses)
    await tryStep(client, "create sections", `
      CREATE TABLE IF NOT EXISTS sections (
        id         TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        course_id  TEXT REFERENCES courses(id) ON DELETE CASCADE,
        title_ar   TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // lessons (depends on sections)
    await tryStep(client, "create lessons", `
      CREATE TABLE IF NOT EXISTS lessons (
        id               TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        section_id       TEXT REFERENCES sections(id) ON DELETE CASCADE,
        title_ar         TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        sort_order       INTEGER NOT NULL DEFAULT 0,
        created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // enrollments (depends on users + courses)
    await tryStep(client, "create enrollments", `
      CREATE TABLE IF NOT EXISTS enrollments (
        id          TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);

    // orders (depends on users + courses)
    await tryStep(client, "create orders", `
      CREATE TABLE IF NOT EXISTS orders (
        id           TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        coupon_id    TEXT,
        total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        status       TEXT NOT NULL DEFAULT 'pending',
        created_at   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // coupons (no FK dependencies)
    await tryStep(client, "create coupons", `
      CREATE TABLE IF NOT EXISTS coupons (
        id              TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        code            TEXT UNIQUE NOT NULL,
        discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        max_uses        INTEGER,
        used_count      INTEGER NOT NULL DEFAULT 0,
        expires_at      TIMESTAMP,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // otp_codes (no FK dependencies)
    await tryStep(client, "create otp_codes", `
      CREATE TABLE IF NOT EXISTS otp_codes (
        id            TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        phone         TEXT NOT NULL,
        email         TEXT NOT NULL,
        code          TEXT NOT NULL,
        full_name     TEXT,
        password_hash TEXT,
        educational_level TEXT,
        used          BOOLEAN NOT NULL DEFAULT false,
        expires_at    TIMESTAMP NOT NULL,
        created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // course_ratings — intentionally no FK constraints because the users table
    // may use a different ID type in some deployments, which caused:
    // "foreign key constraint course_ratings_user_id_fkey cannot be implemented"
    await tryStep(client, "create course_ratings", `
      CREATE TABLE IF NOT EXISTS course_ratings (
        id         TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        user_id    TEXT NOT NULL,
        course_id  TEXT NOT NULL,
        rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment    TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);

    // lesson_progress (no strict FK — user_id/lesson_id are soft refs)
    await tryStep(client, "create lesson_progress", `
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id           TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        user_id      TEXT NOT NULL,
        lesson_id    TEXT NOT NULL,
        course_id    TEXT,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      )
    `);

    // video_assets (depends on lessons)
    await tryStep(client, "create video_assets", `
      CREATE TABLE IF NOT EXISTS video_assets (
        id             TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
        bunny_video_id TEXT NOT NULL,
        lesson_id      TEXT UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
        status         TEXT NOT NULL DEFAULT 'pending',
        duration_seconds INTEGER,
        thumbnail_url  TEXT,
        url            TEXT,
        created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ── 4. Incremental patches (ALTER TABLE / ADD COLUMN / UPDATE) ─────────────
    // These are all safe no-ops if the column/index already exists.

    // users patches
    await tryStep(client, "users.updated_at default",     "ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP");
    await tryStep(client, "users.educational_level col",  "ALTER TABLE users ADD COLUMN IF NOT EXISTS educational_level TEXT NOT NULL DEFAULT 'secondary'");
    await tryStep(client, "users.role default STUDENT",   "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'STUDENT'");

    // otp_codes patches (columns added in older deploys)
    await tryStep(client, "otp_codes.email col",          "ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS email TEXT");
    await tryStep(client, "otp_codes.full_name col",      "ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS full_name TEXT");
    await tryStep(client, "otp_codes.password_hash col",  "ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS password_hash TEXT");
    await tryStep(client, "otp_codes.educational_level",  "ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS educational_level TEXT");

    // lessons patches
    await tryStep(client, "lessons.id default",           "ALTER TABLE lessons ALTER COLUMN id SET DEFAULT (uuid_generate_v4())::text");
    await tryStep(client, "lessons.created_at default",   "ALTER TABLE lessons ALTER COLUMN created_at SET DEFAULT NOW()");
    await tryStep(client, "lessons.updated_at col",       "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()");
    await tryStep(client, "lessons.updated_at default",   "ALTER TABLE lessons ALTER COLUMN updated_at SET DEFAULT NOW()");

    // enrollments patches
    await tryStep(client, "enrollments.enrolled_at col",  "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP DEFAULT NOW()");
    await tryStep(client, "enrollments.id default",       "ALTER TABLE enrollments ALTER COLUMN id SET DEFAULT (uuid_generate_v4())::text");
    await tryStep(client, "enrollments.enrolled_at def",  "ALTER TABLE enrollments ALTER COLUMN enrolled_at SET DEFAULT NOW()");

    // courses patches
    await tryStep(client, "courses.published col",        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true");
    await tryStep(client, "courses.thumbnail_url col",    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT");
    await tryStep(client, "courses.instructor_id col",    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id TEXT");

    // orders patches
    await tryStep(client, "orders.course_id col",         "ALTER TABLE orders ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES courses(id) ON DELETE CASCADE");
    await tryStep(client, "orders.coupon_id col",         "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id TEXT");
    await tryStep(client, "orders.total_amount col",      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) NOT NULL DEFAULT 0");
    await tryStep(client, "orders.status col",            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'");
    await tryStep(client, "orders.discount_amount col",   "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0");
    await tryStep(client, "orders.updated_at col",        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()");
    await tryStep(client, "orders.updated_at default",    "ALTER TABLE orders ALTER COLUMN updated_at SET DEFAULT NOW()");

    // video_assets patches
    await tryStep(client, "video_assets.status col",      "ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'");
    await tryStep(client, "video_assets.duration col",    "ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS duration_seconds INTEGER");
    await tryStep(client, "video_assets.thumbnail col",   "ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT");
    await tryStep(client, "video_assets.url col",         "ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS url TEXT");
    await tryStep(client, "video_assets.updated_at col",  "ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()");
    await tryStep(client, "video_assets.updated_at def",  "ALTER TABLE video_assets ALTER COLUMN updated_at SET DEFAULT NOW()");
    await tryStep(client, "video_assets.id default",      "ALTER TABLE video_assets ALTER COLUMN id SET DEFAULT (uuid_generate_v4())::text");

    // ── lesson_progress schema normalisation ──────────────────────────────
    // The table may have been created by an earlier migration without a DEFAULT
    // on the id column, causing "null value in column id violates not-null
    // constraint" on every INSERT.  Both SET DEFAULT calls are attempted so we
    // cover a TEXT id column (first) AND a UUID id column (second).
    await tryStep(client, "lesson_progress id default (uuid cast)",
      "ALTER TABLE lesson_progress ALTER COLUMN id SET DEFAULT (uuid_generate_v4())::text"
    );
    await tryStep(client, "lesson_progress id default (uuid native)",
      "ALTER TABLE lesson_progress ALTER COLUMN id SET DEFAULT uuid_generate_v4()"
    );

    // Ensure completed_at has a DEFAULT (some older schemas left it nullable)
    await tryStep(client, "lesson_progress completed_at default",
      "ALTER TABLE lesson_progress ALTER COLUMN completed_at SET DEFAULT NOW()"
    );

    // Add completed BOOLEAN column if the DB was created with the alternate schema
    await tryStep(client, "lesson_progress.completed col",
      "ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT TRUE"
    );

    // lesson_progress: ensure course_id column exists (older DBs may be missing it)
    await tryStep(client, "lesson_progress.course_id col",
      "ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS course_id TEXT"
    );

    // lesson_progress: backfill NULL course_id rows so progress queries are accurate
    await tryStep(client, "lesson_progress backfill course_id", `
      UPDATE lesson_progress lp
      SET course_id = (
        SELECT s.course_id
        FROM lessons  l
        JOIN sections s ON s.id = l.section_id
        WHERE l.id = lp.lesson_id
      )
      WHERE lp.course_id IS NULL
    `);

    // lesson_progress: index for the JOIN-based progress queries (lesson_id lookup)
    await tryStep(client, "lesson_progress idx lesson_id", `
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
      ON lesson_progress(lesson_id)
    `);

    // lesson_progress: composite index for user + course fast-path
    await tryStep(client, "lesson_progress idx user_course", `
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course
      ON lesson_progress(user_id, course_id)
    `);

    // ── 5. Role system migration: convert old lowercase roles to UPPERCASE ─────
    await tryStep(client, "migrate role admin→ADMIN",   `UPDATE users SET role = 'ADMIN'   WHERE role = 'admin'`);
    await tryStep(client, "migrate role user→STUDENT",  `UPDATE users SET role = 'STUDENT' WHERE role = 'user'`);

    console.log("[DB] ✅ All migrations applied successfully.");
  } finally {
    client.release();
  }
}
