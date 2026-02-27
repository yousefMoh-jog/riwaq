import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Users, BookOpen, Star, DollarSign, Loader2, BarChart2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  month: string;
  revenue: number;
  enrollments: number;
}

interface TopCourse {
  title: string;
  count: number;
}

interface CompletionRate {
  title: string;
  enrolled: number;
  completed: number;
}

interface RatingDist {
  rating: number;
  count: number;
}

interface Summary {
  total_users: string;
  total_enrollments: string;
  active_courses: string;
  avg_rating: string;
  total_revenue: string;
}

interface AnalyticsData {
  monthly: MonthlyPoint[];
  topCourses: TopCourse[];
  completionRates: CompletionRate[];
  ratingDist: RatingDist[];
  summary: Summary;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, string> = {
  '01': 'يناير', '02': 'فبراير', '03': 'مارس',  '04': 'أبريل',
  '05': 'مايو',  '06': 'يونيو',  '07': 'يوليو', '08': 'أغسطس',
  '09': 'سبتمبر','10': 'أكتوبر','11': 'نوفمبر','12': 'ديسمبر',
};

function formatMonth(ym: string) {
  const [, m] = ym.split('-');
  return MONTH_NAMES[m] ?? ym;
}

function fillMonths(data: MonthlyPoint[]): MonthlyPoint[] {
  const map = new Map(data.map((d) => [d.month, d]));
  const result: MonthlyPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push(map.get(key) ?? { month: key, revenue: 0, enrollments: 0 });
  }
  return result;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      <p className="text-[#3B2F82] dark:text-[#8478C9]">{Number(payload[0].value).toLocaleString('ar-EG')} د.ل</p>
    </div>
  );
}

function EnrollTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      <p className="text-green-600 dark:text-green-400">{payload[0].value} تسجيل</p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  const monthly = data ? fillMonths(data.monthly).map((m) => ({
    ...m,
    label: formatMonth(m.month),
    revenue: Number(m.revenue),
    enrollments: Number(m.enrollments),
  })) : [];

  const summary = data?.summary;
  const statCards = summary ? [
    {
      label: 'إجمالي الإيرادات',
      value: `${Number(summary.total_revenue).toLocaleString('ar-EG')} د.ل`,
      icon: DollarSign,
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'إجمالي التسجيلات',
      value: Number(summary.total_enrollments).toLocaleString('ar-EG'),
      icon: Users,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'الدورات المنشورة',
      value: Number(summary.active_courses).toLocaleString('ar-EG'),
      icon: BookOpen,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'متوسط التقييم',
      value: Number(summary.avg_rating).toFixed(1),
      icon: Star,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
    },
  ] : [];

  const maxTopCount = Math.max(1, ...(data?.topCourses.map((c) => c.count) ?? [1]));
  const maxRatingCount = Math.max(1, ...(data?.ratingDist.map((r) => r.count) ?? [1]));

  return (
    <AdminLayout>
      <div className="p-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#3B2F82]/10 dark:bg-[#8478C9]/20 rounded-full p-3">
            <BarChart2 className="w-6 h-6 text-[#3B2F82] dark:text-[#8478C9]" />
          </div>
          <div>
            <h1 className="text-3xl text-gray-900 dark:text-white">التحليلات</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">نظرة شاملة على أداء المنصة</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-400 dark:text-slate-500 gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span>جاري تحميل البيانات...</span>
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex items-center gap-4 theme-transition"
                  >
                    <div className={`${card.bg} rounded-full p-3 flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{card.label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Revenue Chart ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 theme-transition">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-[#3B2F82] dark:text-[#8478C9]" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">الإيرادات الشهرية</h2>
                <span className="text-xs text-gray-400 dark:text-slate-500 mr-auto">آخر 12 شهرًا</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B2F82" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B2F82" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-slate-700" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55}
                    tickFormatter={(v) => v.toLocaleString('ar-EG')} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone" dataKey="revenue"
                    stroke="#3B2F82" strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Enrollments Chart ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 theme-transition">
              <div className="flex items-center gap-2 mb-6">
                <Users size={18} className="text-green-600 dark:text-green-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">التسجيلات الشهرية</h2>
                <span className="text-xs text-gray-400 dark:text-slate-500 mr-auto">آخر 12 شهرًا</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-slate-700" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35} allowDecimals={false} />
                  <Tooltip content={<EnrollTooltip />} />
                  <Bar dataKey="enrollments" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Bottom row: Top Courses + Ratings ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* Top Courses */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 theme-transition">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen size={18} className="text-[#3B2F82] dark:text-[#8478C9]" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">أكثر الدورات تسجيلًا</h2>
                </div>
                <div className="space-y-3">
                  {(data?.topCourses ?? []).map((course, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-slate-200 truncate max-w-[75%]">{course.title}</span>
                        <span className="text-gray-500 dark:text-slate-400 flex-shrink-0">{course.count} طالب</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-[#3B2F82] dark:bg-[#8478C9] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((course.count / maxTopCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(data?.topCourses ?? []).length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">لا توجد بيانات بعد</p>
                  )}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 theme-transition">
                <div className="flex items-center gap-2 mb-5">
                  <Star size={18} className="text-yellow-500" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">توزيع التقييمات</h2>
                </div>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const entry = data?.ratingDist.find((r) => r.rating === star);
                    const count = entry?.count ?? 0;
                    const pct = maxRatingCount > 0 ? Math.round((count / maxRatingCount) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600 dark:text-slate-300 w-4 text-center">{star}</span>
                        <Star size={13} className="text-yellow-400 flex-shrink-0" fill="#facc15" />
                        <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-gray-500 dark:text-slate-400 w-6 text-left">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Completion Rates Table ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden theme-transition">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#3B2F82] dark:text-[#8478C9]" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">معدلات الإتمام</h2>
              </div>
              {(data?.completionRates ?? []).length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-sm">
                  لا توجد بيانات إتمام بعد
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">الدورة</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">المسجلون</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">المكتملون</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">نسبة الإتمام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {(data?.completionRates ?? []).map((row, i) => {
                      const pct = row.enrolled > 0
                        ? Math.round((row.completed / row.enrolled) * 100)
                        : 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                            {row.title}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{row.enrolled}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{row.completed}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 min-w-[60px]">
                                <div
                                  className="bg-[#3B2F82] dark:bg-[#8478C9] h-1.5 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 dark:text-slate-300 w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}
