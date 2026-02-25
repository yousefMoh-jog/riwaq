import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { validateEnv } from "./config/env.js";
import { ensureMigrations } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST = join(__dirname, "..", "dist");
const UPLOADS = join(__dirname, "..", "uploads");

validateEnv();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5176",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// JSON limit is kept small (metadata only — video files go through multer, not this parser)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (req, res) =>
  res.json({ ok: true, message: "Backend is running" })
);

// Serve uploaded files (thumbnails, etc.)
app.use("/uploads", express.static(UPLOADS));

app.use(authRoutes);
app.use(courseRoutes);
app.use(adminRoutes);
app.use(paymentRoutes);

// Serve the built React frontend when dist/ exists (production)
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (_req, res) => res.sendFile(join(DIST, "index.html")));
}

const BASE_PORT = Number(process.env.PORT ?? 8001);
const MAX_PORT_ATTEMPTS = 10;

// Tries to listen on `port`. If EADDRINUSE, increments and retries up to
// MAX_PORT_ATTEMPTS times, then gives up with a clear message.
function listenWithFallback(port, attempt = 1) {
  const server = app.listen(port);

  server.once("listening", () => {
    if (port !== BASE_PORT) {
      console.warn(
        `[STARTUP] ⚠️  Port ${BASE_PORT} was busy — using port ${port} instead.`
      );
      console.warn(
        `[STARTUP]    Update PORT in server/.env to ${port} to make this permanent.`
      );
    }
    console.log(`[STARTUP] ✅ Backend running on http://localhost:${port}`);
    // 10-minute timeout — large video files need time to travel browser → server → Bunny
    server.timeout = 600_000;
    server.keepAliveTimeout = 620_000;
  });

  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[STARTUP] ⚠️  Port ${port} is already in use.`);
      if (attempt >= MAX_PORT_ATTEMPTS) {
        console.error(
          `[STARTUP] ❌ Could not find a free port after ${MAX_PORT_ATTEMPTS} attempts ` +
          `(tried ${BASE_PORT}–${port}).`
        );
        console.error(
          `[STARTUP]    Run this to find what is using port ${BASE_PORT}:\n` +
          `             netstat -ano | findstr :${BASE_PORT}`
        );
        process.exit(1);
      }
      console.warn(`[STARTUP]    Trying port ${port + 1}...`);
      listenWithFallback(port + 1, attempt + 1);
    } else {
      console.error("[STARTUP] ❌ Unexpected server error:", err);
      process.exit(1);
    }
  });
}

ensureMigrations()
  .then(() => listenWithFallback(BASE_PORT))
  .catch((err) => {
    console.error("[STARTUP] ❌ Failed to run DB migrations. Full error below:");
    console.error(err);
    process.exit(1);
  });
