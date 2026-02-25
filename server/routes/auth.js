import { Router } from "express";
import { otpRequestLimiter, otpVerifyLimiter } from "../middleware/rateLimiters.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  requestOtp,
  verifyOtp,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/request-otp", otpRequestLimiter, requestOtp);
router.post("/auth/verify-otp", otpVerifyLimiter, verifyOtp);
router.get("/auth/me", authMiddleware, getMe);
router.put("/auth/change-password", authMiddleware, changePassword);

export default router;
