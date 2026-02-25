import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { educationalLevelLabel } from '../lib/utils';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { RiwaqFooter } from '../app/components/RiwaqFooter';
import { BookOpen, GraduationCap, Lightbulb, Award } from 'lucide-react';
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

export function DashboardPage() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">يتم التحميل...</p>
      </div>
    );
  }

  const getDashboardContent = () => {
    switch (user.educationalLevel) {
      case 'preparatory':
        return {
          title: 'محتوى مبسط لتقوية الأساسيات',
          description: 'دورات مصممة خصيصاً لطلاب المرحلة الإعدادية لبناء أساس قوي في جميع المواد',
          icon: <Lightbulb className="w-12 h-12 text-primary" />,
          color: 'from-blue-500 to-cyan-500'
        };
      case 'secondary':
        return {
          title: 'محتوى تطوير مهارات المرحلة الثانوية',
          description: 'برامج تعليمية متقدمة لطلاب الثانوية للتحضير للامتحانات والجامعة',
          icon: <BookOpen className="w-12 h-12 text-primary" />,
          color: 'from-purple-500 to-pink-500'
        };
      case 'university':
        return {
          title: 'محتوى احترافي ومتقدم للطلاب الجامعيين',
          description: 'دورات تخصصية ومهنية لتطوير المهارات الأكاديمية والمهنية',
          icon: <GraduationCap className="w-12 h-12 text-primary" />,
          color: 'from-orange-500 to-red-500'
        };
      default:
        return {
          title: 'محتوى تطوير مهارات المرحلة الثانوية',
          description: 'برامج تعليمية متقدمة لطلاب الثانوية للتحضير للامتحانات والجامعة',
          icon: <BookOpen className="w-12 h-12 text-primary" />,
          color: 'from-purple-500 to-pink-500'
        };
    }
  };

  const content = getDashboardContent();

  return (
    <div className="min-h-screen flex flex-col">
      <RiwaqHeader />
      
      <main className="flex-1 bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-lg p-8 mb-8 text-white">
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
                  className="bg-white text-primary px-6 py-3 rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
                >
                  <Award size={20} />
                  <span>{user.role === 'INSTRUCTOR' ? 'لوحة المدرس' : 'لوحة تحكم الادمن'}</span>
                </Link>
              )}
            </div>
          </div>

          {/* User Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-sm text-muted-foreground mb-2">البريد الإلكتروني</h3>
              <p className="text-lg">{user.email}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-sm text-muted-foreground mb-2">المستوى التعليمي</h3>
              <p className="text-lg">{educationalLevelLabel(user.educationalLevel)}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-sm text-muted-foreground mb-2">تاريخ الانضمام</h3>
              <p className="text-lg">
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
              <h2 className="text-2xl mb-6">دوراتي</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course-viewer/${course.id}`}
                    className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg mb-4">{course.title}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">التقدم</span>
                        <span className="font-medium">{course.progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {course.progress.completedLessons} من {course.progress.totalLessons} درس مكتمل
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/courses"
              className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg mb-1">الدورات المتاحة</h3>
                  <p className="text-sm text-muted-foreground">استكشف جميع الدورات</p>
                </div>
              </div>
            </Link>

            <Link
              to="/profile"
              className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 rounded-full p-3">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg mb-1">الملف الشخصي</h3>
                  <p className="text-sm text-muted-foreground">إدارة حسابك</p>
                </div>
              </div>
            </Link>

            <Link
              to="/courses"
              className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-secondary/10 rounded-full p-3">
                  <GraduationCap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg mb-1">اكتشف المزيد</h3>
                  <p className="text-sm text-muted-foreground">دورات جديدة</p>
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
