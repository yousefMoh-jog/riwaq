import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { downloadCertificate } from '../lib/certificate';
import {
  Play, CheckCircle, Circle, Lock, ChevronDown, ChevronUp,
  BookOpen, ArrowLeft, Zap, Award,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  duration: number;
  order_index: number;
  section_id: string;
  completed?: boolean;
}

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  isEnrolled: boolean;
}

interface Progress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  return `${m} د`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CourseViewerPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (!courseId) return;
    // Load course structure, completed lesson IDs, and overall progress in parallel
    initialLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isAuthenticated]);

  const initialLoad = async () => {
    try {
      // Run all three fetches in parallel — much faster than the old N+1 pattern
      const [courseRes, completedRes, progressRes] = await Promise.allSettled([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/completed-lessons`),
        api.get(`/courses/${courseId}/progress`),
      ]);

      // ── Progress ───────────────────────────────────────────────────────
      if (progressRes.status === 'fulfilled') {
        setProgress(progressRes.value.data);
      }

      // ── Course + section structure ─────────────────────────────────────
      if (courseRes.status !== 'fulfilled') {
        const err = courseRes.reason as { response?: { status?: number } };
        if (err?.response?.status === 403) navigate(`/course/${courseId}`, { replace: true });
        console.error('Failed to fetch course:', courseRes.reason);
        return;
      }

      const data = courseRes.value.data;
      if (!data.isEnrolled) {
        navigate(`/course/${courseId}`, { replace: true });
        return;
      }

      // Build a set of completed lesson IDs from the bulk endpoint
      const completedIds = new Set<string>(
        completedRes.status === 'fulfilled'
          ? (completedRes.value.data.completedLessonIds ?? [])
          : []
      );

      // Fetch sections + their lessons in parallel, mark completed from the set
      const sectionsRaw = data.sections ?? [];
      const sectionResults = await Promise.all(
        sectionsRaw.map(async (section: Section) => {
          try {
            const { data: ld } = await api.get(`/sections/${section.id}/lessons`);
            const lessons: Lesson[] = (ld.lessons ?? []).map((l: Lesson) => ({
              ...l,
              completed: completedIds.has(l.id),
            }));
            return { ...section, lessons };
          } catch {
            return { ...section, lessons: [] };
          }
        })
      );

      const expandAll = new Set<string>(sectionsRaw.map((s: Section) => s.id));

      setCourse({
        id: data.id,
        title: data.title,
        description: data.description,
        sections: sectionResults,
        isEnrolled: data.isEnrolled,
      });
      setExpandedSections(expandAll);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) navigate(`/course/${courseId}`, { replace: true });
      console.error('Failed to load course viewer:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}/progress`);
      setProgress(data);
    } catch { /* non-fatal */ }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // First incomplete (or first) lesson for "Resume" button
  const flatLessons = course?.sections.flatMap((s) => s.lessons) ?? [];
  const firstIncomplete = flatLessons.find((l) => !l.completed) ?? flatLessons[0];

  // ── Loading / Error states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 theme-transition">
        <RiwaqHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#3B2F82] dark:border-[#8478C9] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-slate-400">جاري التحميل...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!course || !course.isEnrolled) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 theme-transition">
        <RiwaqHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Lock className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto" />
            <p className="text-gray-500 dark:text-slate-400">يجب التسجيل في الدورة أولاً</p>
            <Link
              to={`/course/${courseId}`}
              className="inline-block bg-[#3B2F82] dark:bg-[#8478C9] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              عرض تفاصيل الدورة
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 theme-transition">
      <RiwaqHeader />

      <main className="flex-1">
        {/* Course Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-[#3B2F82]/80 text-white py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={15} />
              جميع الدورات
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{course.title}</h1>
                {progress && (
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle size={15} className="text-green-400" />
                    <span>{progress.completedLessons} من {progress.totalLessons} درس مكتمل</span>
                  </div>
                )}
              </div>

              {firstIncomplete && (
                <Link
                  to={`/lesson-viewer/${firstIncomplete.id}`}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm flex-shrink-0"
                >
                  <Zap size={17} />
                  {progress && progress.completedLessons > 0 ? 'متابعة التعلم' : 'ابدأ التعلم'}
                </Link>
              )}
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between text-xs text-white/60">
                  <span>التقدم الكلي</span>
                  <span className="text-green-400 font-medium">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* 🏆 Certificate Download — shown only when 100% complete */}
            {progress?.percentage === 100 && (
              <div className="mt-6 flex items-center gap-4 bg-yellow-400/15 border border-yellow-400/40 rounded-xl px-5 py-4">
                <Award size={28} className="text-yellow-300 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-yellow-200">تهانينا! أتممت الدورة بالكامل 🎉</p>
                  <p className="text-xs text-yellow-200/70 mt-0.5">يمكنك تنزيل شهادة الإتمام الخاصة بك</p>
                </div>
                <button
                  onClick={() =>
                    downloadCertificate({
                      studentName: user?.fullName ?? 'الطالب',
                      courseTitle: course?.title ?? '',
                    })
                  }
                  className="flex-shrink-0 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg"
                >
                  <Award size={16} />
                  تنزيل الشهادة
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lesson List */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {course.sections.map((section, sIdx) => {
            const isOpen = expandedSections.has(section.id);
            const sectionCompleted = section.lessons.filter((l) => l.completed).length;
            const sectionTotal = section.lessons.length;

            return (
              <div key={section.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden theme-transition">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors text-start"
                >
                  <div className="w-8 h-8 rounded-full bg-[#3B2F82]/10 dark:bg-[#8478C9]/20 text-[#3B2F82] dark:text-[#8478C9] font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {sIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{section.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {sectionCompleted}/{sectionTotal} درس مكتمل
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sectionCompleted === sectionTotal && sectionTotal > 0 && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    <span className="text-gray-400 dark:text-slate-500">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </button>

                {/* Lessons */}
                {isOpen && (
                  <div className="border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700/60">
                    {section.lessons.length === 0 ? (
                      <div className="flex items-center gap-3 px-5 py-4 text-sm text-gray-400 dark:text-slate-500">
                        <BookOpen size={16} />
                        لا توجد دروس في هذا القسم بعد
                      </div>
                    ) : (
                      section.lessons.map((lesson, lIdx) => (
                        <Link
                          key={lesson.id}
                          to={`/lesson-viewer/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
                        >
                          {/* Status icon */}
                          <div className="flex-shrink-0">
                            {lesson.completed ? (
                              <CheckCircle size={18} className="text-green-500" />
                            ) : (
                              <Circle size={18} className="text-gray-400 dark:text-slate-500 group-hover:text-[#3B2F82] dark:group-hover:text-[#8478C9] transition-colors" />
                            )}
                          </div>

                          {/* Lesson title */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${lesson.completed ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-white'}`}>
                              {lIdx + 1}. {lesson.title}
                            </p>
                          </div>

                          {/* Duration */}
                          {lesson.duration > 0 && (
                            <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                              {formatDuration(lesson.duration)}
                            </span>
                          )}

                          {/* Play icon on hover */}
                          <Play size={15} className="text-[#3B2F82] dark:text-[#8478C9] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {course.sections.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 py-20 text-center theme-transition">
              <BookOpen size={48} className="text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-400 dark:text-slate-500">لم تُضف دروس لهذه الدورة بعد</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
