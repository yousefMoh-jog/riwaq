import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  User,
  ArrowLeft,
  Sparkles,
  BadgeDollarSign,
} from 'lucide-react';

interface RecentSale {
  id: string;
  student_name: string | null;
  student_email: string | null;
  course_title: string | null;
  price: number;
  purchase_date: string;
}

interface TodaySales {
  count: number;
  revenue: number;
}

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  recentSales: RecentSale[];
  todaySales: TodaySales;
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'INSTRUCTOR') return;
    if (user?.role !== 'ADMIN') return;

    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err: any) {
        console.error('Failed to fetch stats:', err);
        setError(err?.message ?? 'حدث خطأ أثناء تحميل الإحصائيات');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (user?.role === 'INSTRUCTOR') {
    return <Navigate to="/admin/courses" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  /* ─── Stat cards config ─────────────────────────────────────────────── */
  const statCards = [
    {
      label: 'إجمالي المستخدمين',
      value: stats?.totalUsers?.toLocaleString('en-US') ?? '—',
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-900/30',
    },
    {
      label: 'إجمالي الدورات',
      value: stats?.totalCourses?.toLocaleString('en-US') ?? '—',
      icon: BookOpen,
      iconColor: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-900/30',
    },
    {
      label: 'الطلاب المسجّلون',
      value: stats?.totalStudents?.toLocaleString('en-US') ?? '—',
      icon: GraduationCap,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-100 dark:border-purple-900/30',
    },
    {
      label: 'إجمالي الإيرادات',
      value: stats
        ? `${Number(stats.totalRevenue).toLocaleString('en-US')} د.ل`
        : '—',
      icon: DollarSign,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-100 dark:border-orange-900/30',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl mb-1 text-gray-900 dark:text-white">لوحة التحكم</h1>
          <p className="text-gray-500 dark:text-slate-400">نظرة عامة على إحصائيات المنصة</p>
        </div>

        {/* ── Loading / error states ────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 animate-pulse theme-transition">
                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-700 mb-4" />
                <div className="h-7 w-24 bg-gray-100 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-100 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 rounded-lg p-6 mb-8">
            <p className="font-medium">تعذّر تحميل الإحصائيات</p>
            <p className="text-sm mt-1 text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* ── Stats grid ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className={`bg-white dark:bg-slate-800 rounded-xl border ${card.border} shadow-sm p-6 hover:shadow-md transition-shadow theme-transition`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${card.bg} p-3 rounded-lg`}>
                        <Icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-500 opacity-70" />
                    </div>
                    <div className="text-2xl font-bold mb-1 tabular-nums text-gray-900 dark:text-white">{card.value}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{card.label}</div>
                  </div>
                );
              })}
            </div>

            {/* ── Recent Sales ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8 theme-transition">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#3B2F82] dark:text-[#8478C9]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">آخر المبيعات</h2>
                </div>
                <Link
                  to="/admin/orders"
                  className="flex items-center gap-1 text-sm text-[#3B2F82] dark:text-[#8478C9] hover:underline"
                >
                  <span>عرض الكل</span>
                  <ArrowLeft size={14} />
                </Link>
              </div>

              {!stats?.recentSales?.length ? (
                <div className="py-12 text-center text-gray-400 dark:text-slate-500">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-25" />
                  <p>لا توجد مبيعات بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-right font-medium">
                          <div className="flex items-center gap-1.5 justify-end">
                            <User size={13} />
                            <span>الطالب</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          <div className="flex items-center gap-1.5 justify-end">
                            <BookOpen size={13} />
                            <span>الدورة</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          <div className="flex items-center gap-1.5 justify-end">
                            <DollarSign size={13} />
                            <span>المبلغ</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Calendar size={13} />
                            <span>التاريخ</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {stats.recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{sale.student_name || 'غير محدد'}</div>
                            <div className="text-xs text-gray-400 dark:text-slate-500">{sale.student_email || '—'}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                            {sale.course_title || 'غير محدد'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-green-700 dark:text-green-400">
                              {Number(sale.price || 0).toLocaleString('en-US')}
                              <span className="text-xs font-normal text-gray-400 dark:text-slate-500">د.ل</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                            {new Date(sale.purchase_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Welcome banner ──────────────────────────────────────────── */}
        <WelcomeBanner user={user} todaySales={stats?.todaySales ?? null} />
      </div>
    </AdminLayout>
  );
}

// ── WelcomeBanner ─────────────────────────────────────────────────────────────

function WelcomeBanner({
  user,
  todaySales,
}: {
  user: { fullName?: string | null; email?: string | null } | null;
  todaySales: { count: number; revenue: number } | null;
}) {
  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'صباح الخير' :
    hour < 17 ? 'مساء الخير' :
                'مساء النور';

  return (
    <div className="bg-gradient-to-r from-[#2d2468] via-[#3B2F82] to-[#6467AD] rounded-xl shadow-lg p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">

        {/* Left: greeting */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-sm">{greeting}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">
            {user?.fullName || user?.email || 'مدير النظام'} 👋
          </h2>
          <div className="flex items-center gap-1.5 text-white/70 text-sm mt-2">
            <Calendar className="w-4 h-4" />
            <span>{todayLabel}</span>
          </div>
          <p className="text-white/75 text-sm mt-3 leading-relaxed">
            يمكنك إدارة جميع جوانب المنصة من هنا. استخدم القائمة الجانبية للتنقل بين الأقسام المختلفة.
          </p>
        </div>

        {/* Right: today's quick summary */}
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 flex-shrink-0 min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <BadgeDollarSign className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">مبيعات اليوم</span>
          </div>

          {todaySales === null ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-24 bg-white/20 rounded" />
              <div className="h-4 w-16 bg-white/20 rounded" />
            </div>
          ) : todaySales.count === 0 ? (
            <div>
              <p className="text-white text-3xl font-bold">—</p>
              <p className="text-white/60 text-xs mt-1">لا توجد مبيعات اليوم بعد</p>
            </div>
          ) : (
            <div>
              <p className="text-white text-3xl font-bold tabular-nums">
                {Number(todaySales.revenue).toLocaleString('en-US')}
                <span className="text-base font-normal text-white/70 mr-1">د.ل</span>
              </p>
              <p className="text-white/70 text-xs mt-1">
                من {todaySales.count} {todaySales.count === 1 ? 'تسجيل' : 'تسجيل'} جديد
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
