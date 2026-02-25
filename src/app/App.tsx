import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { RiwaqHomePage } from './pages/RiwaqHomePage';
import { RiwaqCoursesPage } from './pages/RiwaqCoursesPage';
import { RiwaqAuthPage } from './pages/RiwaqAuthPage';
import { MobileNavButton } from './components/MobileNavButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SplashScreen } from '../components/SplashScreen';
import { ProfilePage } from '../pages/ProfilePage';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminCoursesPage } from '../pages/admin/AdminCoursesPage';
import { AdminSectionsPage } from '../pages/admin/AdminSectionsPage';
import { AdminLessonsPage } from '../pages/admin/AdminLessonsPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage';
import { CourseDetailsPage } from '../pages/CourseDetailsPage';
import { CourseViewerPage } from '../pages/CourseViewerPage';
import { LessonViewerPage } from '../pages/LessonViewerPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { PaymentSuccessPage } from '../pages/PaymentSuccessPage';

export default function App() {
  const { isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Wait for the auth session restoration check to finish before starting
  // the splash timer, so we never flash unauthenticated content to a
  // returning user whose token is stored in localStorage.
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {!showSplash && (
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<RiwaqHomePage />} />
            <Route path="/courses" element={<RiwaqCoursesPage />} />
            <Route path="/course/:id" element={<CourseDetailsPage />} />
            <Route
              path="/checkout/:courseId"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/login" element={<RiwaqAuthPage />} />
            <Route path="/register" element={<RiwaqAuthPage />} />
            <Route
              path="/course-viewer/:id"
              element={
                <ProtectedRoute>
                  <CourseViewerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lesson-viewer/:id"
              element={
                <ProtectedRoute>
                  <LessonViewerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute>
                  <AdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections"
              element={
                <ProtectedRoute>
                  <AdminSectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/lessons"
              element={
                <ProtectedRoute>
                  <AdminLessonsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/coupons"
              element={
                <ProtectedRoute>
                  <AdminCouponsPage />
                </ProtectedRoute>
              }
            />
            {/* Instructor shortcut: redirect to courses panel */}
            <Route path="/admin/instructor" element={<Navigate to="/admin/courses" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <MobileNavButton />
        </div>
      )}
    </>
  );
}
