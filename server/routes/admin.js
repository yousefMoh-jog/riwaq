import { Router } from "express";
import { requireAdmin, requireInstructor } from "../middleware/auth.js";
import {
  getUsers,
  getStats,
  getCategories,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadThumbnail,
  thumbnailUpload,
  getVideoUploadSignature,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  initUpload,
  registerVideo,
  uploadVideoToLesson,
  videoUploadMiddleware,
  getOrders,
  updateOrder,
  updateUserRole,
} from "../controllers/admin.controller.js";

const router = Router();

// ── Admin-only routes ───────────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, getUsers);
router.put("/admin/users/:id/role", requireAdmin, updateUserRole);
router.get("/admin/stats", requireAdmin, getStats);
router.get("/admin/orders", requireAdmin, getOrders);
router.put("/admin/orders/:id", requireAdmin, updateOrder);
router.get("/admin/categories", requireAdmin, getCategories);
// Coupons are admin-only (accessed via AdminCouponsPage)

// ── Instructor + Admin routes ───────────────────────────────────────────────
router.get("/admin/courses", requireInstructor, getCourses);
router.post("/admin/courses/upload-thumbnail", requireInstructor, thumbnailUpload, uploadThumbnail);
router.post("/admin/courses", requireInstructor, createCourse);
router.put("/admin/courses/:id", requireInstructor, updateCourse);
router.delete("/admin/courses/:id", requireInstructor, deleteCourse);

router.get("/admin/sections", requireInstructor, getSections);
router.post("/admin/sections", requireInstructor, createSection);
router.put("/admin/sections/:id", requireInstructor, updateSection);
router.delete("/admin/sections/:id", requireInstructor, deleteSection);

router.get("/admin/lessons", requireInstructor, getLessons);
router.post("/admin/lessons", requireInstructor, createLesson);
router.put("/admin/lessons/:id", requireInstructor, updateLesson);
router.delete("/admin/lessons/:id", requireInstructor, deleteLesson);
router.post("/admin/lessons/:id/upload-video", requireInstructor, videoUploadMiddleware, uploadVideoToLesson);
router.get("/admin/lessons/:id/upload-signature", requireInstructor, getVideoUploadSignature);
router.post("/admin/lessons/:id/init-upload", requireInstructor, initUpload);
router.post("/admin/lessons/:id/register-video", requireInstructor, registerVideo);

export default router;
