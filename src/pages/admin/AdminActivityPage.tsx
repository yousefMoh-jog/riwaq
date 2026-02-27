import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Activity, BookOpen, CheckCircle, Star, UserPlus,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type EventType = 'all' | 'enrollment' | 'completion' | 'rating' | 'registration';

interface ActivityEvent {
  event_type: 'enrollment' | 'completion' | 'rating' | 'registration';
  user_name: string | null;
  user_email: string | null;
  resource_title: string | null;
  extra: string | null;
  timestamp: string;
}

interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)  return `منذ ${diff} ثانية`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `منذ ${m} دقيقة`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `منذ ${h} ساعة`;
  }
  const d = Math.floor(diff / 86400);
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildDescription(event: ActivityEvent): string {
  const name = event.resource_title ?? '—';
  switch (event.event_type) {
    case 'enrollment':
      return `سجّل في دورة "${name}"`;
    case 'completion':
      return event.extra
        ? `أتم درس "${name}" في قسم "${event.extra}"`
        : `أتم درس "${name}"`;
    case 'rating': {
      const stars = '★'.repeat(Number(event.extra) || 0) + '☆'.repeat(5 - (Number(event.extra) || 0));
      return `قيّم دورة "${name}" بـ ${stars}`;
    }
    case 'registration':
      return 'انضم إلى المنصة كطالب جديد';
    default:
      return '—';
  }
}

// ── Event config ──────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  enrollment:   { Icon: BookOpen,    iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  completion:   { Icon: CheckCircle, iconBg: 'bg-green-100  dark:bg-green-900/30',  iconColor: 'text-green-600  dark:text-green-400'  },
  rating:       { Icon: Star,        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-500 dark:text-yellow-400' },
  registration: { Icon: UserPlus,    iconBg: 'bg-blue-100   dark:bg-blue-900/30',   iconColor: 'text-blue-600   dark:text-blue-400'   },
};

const FILTERS: { type: EventType; label: string }[] = [
  { type: 'all',          label: 'الكل'           },
  { type: 'enrollment',   label: 'التسجيل في الدورات' },
  { type: 'completion',   label: 'إتمام الدروس'   },
  { type: 'rating',       label: 'التقييمات'       },
  { type: 'registration', label: 'مستخدمون جدد'   },
];

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 p-5 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-2/3 bg-gray-100 dark:bg-slate-700/60 rounded" />
      </div>
      <div className="h-3 w-16 bg-gray-100 dark:bg-slate-700/60 rounded" />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminActivityPage() {
  const { user } = useAuth();
  const [events, setEvents]       = useState<ActivityEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [filter, setFilter]       = useState<EventType>('all');

  const fetchActivity = useCallback(async (p: number, t: EventType) => {
    setLoading(true);
    try {
      const { data } = await api.get<ActivityResponse>('/admin/activity', {
        params: { page: p, type: t },
      });
      setEvents(data.events);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('[ActivityLog]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity(page, filter);
  }, [page, filter, fetchActivity]);

  const handleFilter = (t: EventType) => {
    setFilter(t);
    setPage(1);
  };

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return (
    <AdminLayout>
      <div className="p-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#3B2F82]/10 dark:bg-[#8478C9]/20 rounded-full p-3">
              <Activity className="w-6 h-6 text-[#3B2F82] dark:text-[#8478C9]" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-900 dark:text-white">سجل النشاط</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                {total > 0 ? `${total.toLocaleString('en-US')} حدث مسجّل` : 'جميع أحداث المنصة'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.type}
              onClick={() => handleFilter(f.type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.type
                  ? 'bg-[#3B2F82] dark:bg-[#8478C9] text-white'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Feed ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden theme-transition">
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400 dark:text-slate-500 gap-3">
              <Activity size={40} className="opacity-30" />
              <p className="font-medium">لا توجد أحداث مسجّلة بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {events.map((event, i) => {
                const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.registration;
                const { Icon } = cfg;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Icon */}
                    <div className={`${cfg.iconBg} rounded-full p-2 flex-shrink-0 mt-0.5`}>
                      <Icon size={16} className={cfg.iconColor} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {event.user_name || event.user_email || 'مستخدم مجهول'}
                        {event.user_name && event.user_email && (
                          <span className="text-gray-400 dark:text-slate-500 font-normal mr-1.5 text-xs">
                            {event.user_email}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                        {buildDescription(event)}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 mt-1">
                      {relativeTime(event.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              صفحة {page} من {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Inline loader for page changes */}
        {loading && events.length > 0 && (
          <div className="flex justify-center mt-4">
            <Loader2 size={18} className="animate-spin text-gray-400 dark:text-slate-500" />
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
