import rateLimit from "express-rate-limit";

// When DISABLE_RATE_LIMIT=true in server/.env, every limiter becomes a
// transparent pass-through — useful for local development and testing.
const disabled = process.env.DISABLE_RATE_LIMIT === "true";

const passThrough = (_req, _res, next) => next();

// Prevents SMS flooding: max 5 OTP requests per IP per 15 minutes.
// Override via OTP_REQUEST_LIMIT and OTP_WINDOW_MINUTES env vars.
export const otpRequestLimiter = disabled
  ? passThrough
  : rateLimit({
      windowMs: Number(process.env.OTP_WINDOW_MINUTES ?? 15) * 60 * 1000,
      max: Number(process.env.OTP_REQUEST_LIMIT ?? 5),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        ok: false,
        messageAr: "محاولات كثيرة جداً، يرجى الانتظار قبل المحاولة مجدداً",
      },
    });

// Prevents brute-force OTP guessing: max 10 verify attempts per IP per 15 min.
export const otpVerifyLimiter = disabled
  ? passThrough
  : rateLimit({
      windowMs: Number(process.env.OTP_WINDOW_MINUTES ?? 15) * 60 * 1000,
      max: Number(process.env.OTP_VERIFY_LIMIT ?? 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        ok: false,
        messageAr: "محاولات كثيرة جداً، يرجى الانتظار قبل المحاولة مجدداً",
      },
    });
