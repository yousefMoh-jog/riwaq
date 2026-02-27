import { Router } from "express";
import {
  authMiddleware,
  requireEnrollment,
  requireEnrollmentForSection,
  optionalAuth,
} from "../middleware/auth.js";
import {
  getCourses,
  getCourse,
  checkEnrolled,
  enroll,
  fakePay,
  getMyCourses,
  getCourseSections,
  getSectionLessons,
  getLesson,
  completeLesson,
  toggleLessonCompletion,
  getCourseProgress,
  getCompletedLessons,
  streamLesson,
  getPublicCategories,
  getRatings,
  submitRating,
  toggleFavorite,
  getFavorites,
} from "../controllers/courses.controller.js";

const router = Router();

// Public categories list (used by the courses filter page)
router.get("/categories", getPublicCategories);

router.get("/courses", getCourses);
router.get("/courses/:id", optionalAuth, getCourse);
router.get("/courses/:id/enrolled", authMiddleware, checkEnrolled);
router.post("/courses/:id/enroll", authMiddleware, enroll);
router.post("/orders/:courseId/fake-pay", authMiddleware, fakePay);
router.get("/enrollments/my-courses", authMiddleware, getMyCourses);
router.get("/courses/:courseId/sections", requireEnrollment, getCourseSections);
router.get("/sections/:sectionId/lessons", requireEnrollmentForSection, getSectionLessons);
router.get("/lessons/:id", authMiddleware, getLesson);
router.post("/lessons/:id/complete", authMiddleware, completeLesson);
router.post("/courses/:courseId/lessons/:lessonId/complete", authMiddleware, toggleLessonCompletion);
router.get("/courses/:id/progress", authMiddleware, getCourseProgress);
router.get("/courses/:courseId/completed-lessons", authMiddleware, getCompletedLessons);
router.get("/courses/:courseId/ratings", getRatings);
router.post("/courses/:courseId/ratings", authMiddleware, submitRating);
router.get("/lessons/:id/stream", authMiddleware, streamLesson);

// Favorites
router.get("/favorites", authMiddleware, getFavorites);
router.post("/courses/:courseId/favorite", authMiddleware, toggleFavorite);

export default router;
