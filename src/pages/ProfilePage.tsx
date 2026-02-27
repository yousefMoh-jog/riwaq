import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { educationalLevelLabel } from '../lib/utils';
import { downloadCertificate } from '../lib/certificate';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { RiwaqFooter } from '../app/components/RiwaqFooter';
import { CourseCard } from '../app/components/CourseCard';
import {
  BookOpen, Heart, Trophy, Calendar, Lock,
  CheckCircle, Download, User, Loader2,
  GraduationCap, ArrowLeft,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'courses' | 'favorites' | 'certificates' | 'settings';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  educational_level: string;
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

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'courses',      label: 'دوراتي',     icon: <BookOpen  size={17} /> },
  { id: 'favorites',   label: 'مفضلاتي',    icon: <Heart     size={17} /> },
  { id: 'certificates',label: 'شهاداتي',    icon: <Trophy    size={17} /> },
  { id: 'settings',    label: 'الإعدادات',  icon: <Lock      size={17} /> },
];

// ── Main component ────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('courses');

  // Data
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [favorites,       setFavorites]       = useState<FavoriteCourse[]>([]);
  const [loadingCourses,   setLoadingCourses]  = useState(true);
  const [loadingFavorites, setLoadingFavorites]= useState(true);

  // Password form
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [pwLoading,        setPwLoading]        = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEnrolledCourses();
    fetchFavorites();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const { data } = await api.get('/enrollments/my-courses');
      const withProgress = await Promise.all(
        (data as any[]).map(async (c) => {
          try {
            const { data: progress } = await api.get(`/courses/${c.id}/progress`);
            return { ...c, progress };
          } catch {
            return { ...c, progress: { percentage: 0, completedLessons: 0, totalLessons: 0 } };
          }
        })
      );
      setEnrolledCourses(withProgress);
    } catch { /* stay empty */ }
    finally { setLoadingCourses(false); }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/favorites');
      setFavorites(data.favorites || []);
    } catch { /* stay empty */ }
    finally { setLoadingFavorites(false); }
  };

  // Derived stats
  const totalCompletedLessons = enrolledCourses.reduce((s, c) => s + c.progress.completedLessons, 0);
  const totalLessons           = enrolledCourses.reduce((s, c) => s + c.progress.totalLessons,    0);
  const overallPct             = totalLessons > 0 ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0;
  const certificates           = enrolledCourses.filter((c) => c.progress.percentage === 100);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'كلمة المرور وتأكيدها غير متطابقين' });
      return;
    }
    setPwLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
      if (data.ok) {
        setPwMessage({ type: 'success', text: data.messageAr || 'تم تغيير كلمة المرور بنجاح' });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setPwMessage({ type: 'error', text: data.messageAr || 'حدث خطأ' });
      }
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message || 'حدث خطأ' });
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin" style={{ color: '#3B2F82' }} />
      </div>
    );
  }

  const initials = (user.fullName || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f5f9' }}>
      <RiwaqHeader />

      {/* ══ Hero ════════════════════════════════════════════════════════════ */}
      <section
        style={{ background: 'linear-gradient(135deg, #2d2468 0%, #3B2F82 40%, #6467AD 100%)' }}
        className="relative overflow-hidden py-14 px-4"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03]" />

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
            className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 shadow-2xl ring-4 ring-white/20"
            style={{ background: 'linear-gradient(135deg, #F3BD32 0%, #d4a012 100%)' }}
          >
            <span className="text-white select-none">{initials}</span>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-white text-center sm:text-right flex-1"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              {user.fullName || 'المستخدم'}
            </h1>
            <p className="text-white/60 text-sm mb-4">{user.email}</p>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {user.createdAt && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/10 text-white/80 border border-white/10">
                  <Calendar size={11} />
                  عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
                </span>
              )}
              {user.educationalLevel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/10 text-white/80 border border-white/10">
                  <GraduationCap size={11} />
                  {educationalLevelLabel(user.educationalLevel)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/10 text-white/80 border border-white/10">
                <User size={11} />
                {user.role === 'ADMIN' ? 'مدير' : user.role === 'INSTRUCTOR' ? 'مدرّس' : 'طالب'}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ Stats Row ══════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto w-full px-4 -mt-7 relative z-20 mb-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Enrolled */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-lg border border-white/80 p-4 sm:p-5 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #eef0fb, #dde0f7)' }}>
              <BookOpen size={20} style={{ color: '#3B2F82' }} />
            </div>
            {loadingCourses
              ? <Loader2 size={18} className="animate-spin text-muted-foreground" />
              : <span className="text-xl sm:text-2xl font-bold" style={{ color: '#3B2F82' }}>
                  {enrolledCourses.length}
                </span>
            }
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">الدورات المسجّلة</p>
          </motion.div>

          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-white rounded-2xl shadow-lg border border-white/80 p-4 sm:p-5 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            {loadingCourses
              ? <Loader2 size={18} className="animate-spin text-muted-foreground" />
              : <span className="text-xl sm:text-2xl font-bold text-emerald-600">{overallPct}%</span>
            }
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">إجمالي التقدم</p>
          </motion.div>

          {/* Certificates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.29 }}
            className="bg-white rounded-2xl shadow-lg border border-white/80 p-4 sm:p-5 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #fef9ec, #fdf0c0)' }}>
              <Trophy size={20} style={{ color: '#d4a012' }} />
            </div>
            {loadingCourses
              ? <Loader2 size={18} className="animate-spin text-muted-foreground" />
              : <span className="text-xl sm:text-2xl font-bold" style={{ color: '#d4a012' }}>
                  {certificates.length}
                </span>
            }
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">الشهادات المكتسبة</p>
          </motion.div>
        </div>
      </div>

      {/* ══ Tabs + Content ═════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-12">

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 mb-5 overflow-hidden">
          <div className="flex" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-4 text-xs sm:text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={ activeTab === tab.id ? { color: '#3B2F82' } : {} }
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>

                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profile-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full"
                    style={{ background: '#3B2F82' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >

            {/* ── دوراتي ──────────────────────────────────────────────── */}
            {activeTab === 'courses' && (
              loadingCourses ? (
                <LoadingSpinner />
              ) : enrolledCourses.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={44} style={{ color: '#3B2F82' }} />}
                  bg="#eef0fb"
                  title="لم تسجّل في أي دورة بعد"
                  subtitle="استكشف مئات الدورات وابدأ رحلتك التعليمية الآن"
                  actionLabel="استكشاف الدورات"
                  actionTo="/courses"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledCourses.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CourseProgressCard course={course} />
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* ── مفضلاتي ─────────────────────────────────────────────── */}
            {activeTab === 'favorites' && (
              loadingFavorites ? (
                <LoadingSpinner />
              ) : favorites.length === 0 ? (
                <EmptyState
                  icon={<Heart size={44} className="text-rose-400" />}
                  bg="#fff1f2"
                  title="قائمة المفضلة فارغة"
                  subtitle="اضغط على أيقونة القلب في أي دورة لإضافتها إلى مفضلتك"
                  actionLabel="استكشاف الدورات"
                  actionTo="/courses"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {favorites.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CourseCard
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
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* ── شهاداتي ─────────────────────────────────────────────── */}
            {activeTab === 'certificates' && (
              loadingCourses ? (
                <LoadingSpinner />
              ) : certificates.length === 0 ? (
                <EmptyState
                  icon={<Trophy size={44} style={{ color: '#d4a012' }} />}
                  bg="#fef9ec"
                  title="لم تكسب أي شهادة بعد"
                  subtitle="أكمل دورة كاملة حتى تحصل على شهادتك الإلكترونية"
                  actionLabel="الذهاب إلى دوراتي"
                  actionTo=""
                  onAction={() => setActiveTab('courses')}
                />
              ) : (
                <div className="space-y-3">
                  {certificates.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <CertificateCard
                        course={course}
                        studentName={user.fullName || user.email || 'الطالب'}
                      />
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* ── الإعدادات ────────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="space-y-5">
                {/* Account Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-border/40 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                         style={{ background: '#eef0fb' }}>
                      <User size={17} style={{ color: '#3B2F82' }} />
                    </div>
                    <h2 className="text-base font-medium">معلومات الحساب</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'الاسم الكامل',     value: user.fullName || 'غير محدد' },
                      { label: 'البريد الإلكتروني', value: user.email   || 'غير محدد' },
                      { label: 'رقم الهاتف',        value: user.phone,  ltr: true },
                      { label: 'المستوى التعليمي',  value: educationalLevelLabel(user.educationalLevel) },
                    ].map(({ label, value, ltr }) => (
                      <div key={label}
                           className="rounded-xl px-4 py-3 border border-border/40"
                           style={{ background: '#f7f8fc' }}>
                        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
                        <p className="text-sm font-medium" dir={ltr ? 'ltr' : undefined}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password Change */}
                <div className="bg-white rounded-2xl shadow-sm border border-border/40 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                         style={{ background: '#eef0fb' }}>
                      <Lock size={17} style={{ color: '#3B2F82' }} />
                    </div>
                    <div>
                      <h2 className="text-base font-medium">تغيير كلمة المرور</h2>
                      <p className="text-[11px] text-muted-foreground">استخدم كلمة مرور قوية لحماية حسابك</p>
                    </div>
                  </div>

                  {pwMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-5 p-4 rounded-xl text-sm ${
                        pwMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {pwMessage.text}
                    </motion.div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {[
                      { label: 'كلمة المرور الحالية',         value: currentPassword, set: setCurrentPassword,  min: 1 },
                      { label: 'كلمة المرور الجديدة',          value: newPassword,      set: setNewPassword,      min: 8 },
                      { label: 'تأكيد كلمة المرور الجديدة',   value: confirmPassword,  set: setConfirmPassword,  min: 8 },
                    ].map(({ label, value, set, min }) => (
                      <div key={label}>
                        <label className="block text-sm mb-1.5 text-foreground/80">{label}</label>
                        <input
                          type="password"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          required
                          minLength={min}
                          style={{ background: '#f7f8fc' }}
                          className="w-full px-4 py-2.5 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition"
                        />
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={pwLoading}
                      style={{ background: 'linear-gradient(135deg, #3B2F82, #6467AD)' }}
                      className="w-full text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                      {pwLoading
                        ? <><Loader2 size={15} className="animate-spin" /> جاري الحفظ...</>
                        : 'حفظ كلمة المرور الجديدة'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      <RiwaqFooter />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#3B2F82' }} />
    </div>
  );
}

function EmptyState({
  icon, bg, title, subtitle, actionLabel, actionTo, onAction,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionTo: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border/40 py-20 flex flex-col items-center gap-4 text-center px-6">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>
      </div>
      {onAction ? (
        <button
          onClick={onAction}
          style={{ background: 'linear-gradient(135deg, #3B2F82, #6467AD)' }}
          className="mt-1 px-7 py-2.5 text-white text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      ) : (
        <Link
          to={actionTo}
          style={{ background: 'linear-gradient(135deg, #3B2F82, #6467AD)' }}
          className="mt-1 px-7 py-2.5 text-white text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function CourseProgressCard({ course }: { course: EnrolledCourse }) {
  const pct  = course.progress.percentage;
  const done = pct === 100;

  return (
    <Link
      to={`/course-viewer/${course.id}`}
      className="group block bg-white rounded-2xl shadow-sm border border-border/40 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium line-clamp-2 flex-1 leading-snug">{course.title}</h3>
        {done ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full text-white bg-emerald-500">
            <CheckCircle size={10} /> مكتملة
          </span>
        ) : (
          <span
            className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#eef0fb', color: '#3B2F82' }}
          >
            {pct}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mb-3">
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className="h-full rounded-full"
            style={{
              background: done
                ? '#16a34a'
                : 'linear-gradient(90deg, #3B2F82, #6467AD)',
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {course.progress.completedLessons} من {course.progress.totalLessons} درس مكتمل
        </p>
      </div>

      <div
        className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#3B2F82' }}
      >
        <span>متابعة التعلّم</span>
        <ArrowLeft size={12} />
      </div>
    </Link>
  );
}

function CertificateCard({ course, studentName }: { course: EnrolledCourse; studentName: string }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-border/40 p-5 flex items-center gap-4"
      style={{ borderRight: '4px solid #F3BD32' }}
    >
      {/* Trophy icon */}
      <div
        className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #fef9ec, #fdf0c0)' }}
      >
        <Trophy size={26} style={{ color: '#d4a012' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium line-clamp-1 mb-0.5">{course.title}</h3>
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle size={11} />
          مكتملة بنجاح — 100٪
        </p>
      </div>

      {/* Download button */}
      <button
        onClick={() => downloadCertificate({ studentName, courseTitle: course.title })}
        style={{ background: 'linear-gradient(135deg, #3B2F82, #6467AD)' }}
        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
      >
        <Download size={13} />
        <span className="hidden sm:inline">تحميل الشهادة</span>
      </button>
    </div>
  );
}
