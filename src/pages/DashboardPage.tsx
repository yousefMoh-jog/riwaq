import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { educationalLevelLabel } from '../lib/utils';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { RiwaqFooter } from '../app/components/RiwaqFooter';
import { CourseCard } from '../app/components/CourseCard';
import { BookOpen, GraduationCap, Lightbulb, Award, Heart } from 'lucide-react';
import { api } from '../lib/api';

interface EnrolledCourse {
  id: string;
  title: string;
  progress: {
    percentage: number;
    completedLessons: number;
    totalLessons: number;
  };
}

interface FavoriteCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: string;
  educational_level: string;
  category_name: string | null;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses]   = useState(true);
  const [favorites, setFavorites]             = useState<FavoriteCourse[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
    fetchFavorites();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const { data } = await api.get('/enrollments/my-courses');
      const coursesWithProgress = await Promise.all(
        data.map(async (course: any) => {
          try {
            const { data: progress } = await api.get(`/courses/${course.id}/progress`);
            return {
              id: course.id,
              title: course.title,
              progress
            };
          } catch {
            return {
              id: course.id,
              title: course.title,
              progress: { percentage: 0, completedLessons: 0, totalLessons: 0 }
            };
          }
        })
      );
      setEnrolledCourses(coursesWithProgress);
    } catch (err) {
      console.error('Failed to fetch enrolled courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/favorites');
      setFavorites(data.favorites || []);
    } catch {
      // Non-critical — section simply stays hidden
    } finally {
      setLoadingFavorites(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <p className="text-gray-500 dark:text-slate-400">يتم التحميل...</p>
      </div>
    );
  }

  const getDashboardContent = () => {
    switch (user.educationalLevel) {
      case 'preparatory':
        return {
          title: 'محتوى مبسط لتقوية الأساسيات',
          description: 'دورات مصممة خصيصاً لطلاب المرحلة الإعدادية لبناء أساس قوي في جميع المواد',
          icon: <Lightbulb className="w-12 h-12 text-white" />,
          color: 'from-blue-500 to-cyan-500'
        };
      case 'secondary':
        return {
          title: 'محتوى تطوير مهارات المرحلة الثانوية',
          description: 'برامج تعليمية متقدمة لطلاب الثانوية للتحضير للامتحانات والجامعة',
          icon: <BookOpen className="w-12 h-12 text-white" />,
          color: 'from-purple-500 to-pink-500'
        };
      case 'university':
        return {
          title: 'محتوى احترافي ومتقدم للطلاب الجامعيين',
          description: 'دورات تخصصية ومهنية لتطوير المهارات الأكاديمية والمهنية',
          icon: <GraduationCap className="w-12 h-12 text-white" />,
          color: 'from-orange-500 to-red-500'
        };
      default:
        return {
          title: 'محتوى تطوير مهارات المرحلة الثانوية',
          description: 'برامج تعليمية متقدمة لطلاب الثانوية للتحضير للامتحانات والجامعة',
          icon: <BookOpen className="w-12 h-12 text-white" />,
          color: 'from-purple-500 to-pink-500'
        };
    }
  };

  const content = getDashboardContent();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 theme-transition">
      <RiwaqHeader />

      <main className="flex-1 bg-gray-50 dark:bg-slate-900 py-12 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-[#2d2468] via-[#3B2F82] to-[#6467AD] rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl mb-2">
                  مرحباً {user.fullName || 'بك'}
                </h1>
                <p className="text-white/90 text-lg">
                  نتمنى لك تجربة تعليمية ممتعة ومفيدة
                </p>
              </div>
              {(user.role === 'ADMIN' || user.role === 'INSTRUCTOR') && (
                <Link
                  to={user.role === 'INSTRUCTOR' ? '/admin/courses' : '/admin/dashboard'}
                  className="bg-white text-[#3B2F82] px-6 py-3 rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
                >
                  <Award size={20} />
                  <span>{user.role === 'INSTRUCTOR' ? 'لوحة المدرس' : 'لوحة تحكم الادمن'}</span>
                </Link>
              )}
            </div>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 theme-transition">
              <h3 className="text-sm text-gray-500 dark:text-slate-400 mb-2">البريد الإلكتروني</h3>
              <p className="text-lg text-gray-900 dark:text-slate-100">{user.email}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 theme-transition">
              <h3 className="text-sm text-gray-500 dark:text-slate-400 mb-2">المستوى التعليمي</h3>
              <p className="text-lg text-gray-900 dark:text-slate-100">{educationalLevelLabel(user.educationalLevel)}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 theme-transition">
              <h3 className="text-sm text-gray-500 dark:text-slate-400 mb-2">تاريخ الانضمام</h3>
              <p className="text-lg text-gray-900 dark:text-slate-100">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'غير محدد'}
              </p>
            </div>
          </div>

          {/* Educational Level Content */}
          <div className={`bg-gradient-to-br ${content.color} rounded-lg shadow-lg p-8 md:p-12 text-white mb-8`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                {content.icon}
              </div>
              <div className="flex-1 text-center md:text-right">
                <h2 className="text-2xl md:text-3xl mb-4">{content.title}</h2>
                <p className="text-white/90 text-lg leading-relaxed">
                  {content.description}
                </p>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          {!loadingCourses && enrolledCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl mb-6 text-gray-900 dark:text-white">دوراتي</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course-viewer/${course.id}`}
                    className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow theme-transition"
                  >
                    <h3 className="text-lg mb-4 text-gray-900 dark:text-white">{course.title}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-slate-400">التقدم</span>
                        <span className="font-medium text-gray-900 dark:text-slate-100">{course.progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {course.progress.completedLessons} من {course.progress.totalLessons} درس مكتمل
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Courses */}
          {!loadingFavorites && favorites.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                <h2 className="text-2xl text-gray-900 dark:text-white">الكورسات المفضلة</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    price={course.price}
                    thumbnail_url={course.thumbnail_url}
                    educational_level={course.educational_level}
                    category_name={course.category_name ?? undefined}
                    showFavorite={true}
                    isFavorited={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Courses */}
            <Link
              to="/courses"
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow theme-transition"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#3B2F82]/10 dark:bg-[#8478C9]/20 rounded-full p-3">
                  <BookOpen className="w-6 h-6 text-[#3B2F82] dark:text-[#8478C9]" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-gray-900 dark:text-white">الدورات المتاحة</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">استكشف جميع الدورات</p>
                </div>
              </div>
            </Link>

            {/* Favorites */}
            <Link
              to="/favorites"
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow theme-transition"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
                  <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-gray-900 dark:text-white">المفضلة</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">دوراتي المحفوظة</p>
                </div>
              </div>
            </Link>

            {/* Profile */}
            <Link
              to="/profile"
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow theme-transition"
            >
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-3">
                  <Award className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-gray-900 dark:text-white">الملف الشخصي</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">إدارة حسابك</p>
                </div>
              </div>
            </Link>

            {/* Discover More */}
            <Link
              to="/courses"
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow theme-transition"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#6467AD]/10 dark:bg-[#6467AD]/20 rounded-full p-3">
                  <GraduationCap className="w-6 h-6 text-[#6467AD] dark:text-[#8478C9]" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-gray-900 dark:text-white">اكتشف المزيد</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">دورات جديدة</p>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </main>

      <RiwaqFooter />
    </div>
  );
}
