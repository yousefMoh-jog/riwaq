import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import Hls from 'hls.js';
import {
  CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown,
  ArrowRight, BookOpen, PlayCircle, Circle, Menu, X, SkipForward,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  duration: number;
  orderIndex: number;
  sectionId: string;
  courseId: string;
  completed: boolean;
  completedAt?: string;
}

interface SidebarLesson {
  id: string;
  title: string;
  duration: number;
  order_index: number;
  section_id: string;
}

interface SidebarSection {
  id: string;
  title: string;
  orderIndex: number;
  lessons: SidebarLesson[];
}

interface CourseInfo {
  id: string;
  title: string;
}

interface Progress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m} د`;
}

// Appends enableApi=1 to a Bunny iframe embed URL so the player fires
// postMessage events (needed for the auto-next "video ended" detection).
function addEnableApi(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('enableApi', '1');
    return u.toString();
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 'enableApi=1';
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function LessonViewerPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Current lesson + playback
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  // embedUrl → iframe player; streamUrl → HLS player
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Sidebar course data
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [courseSections, setCourseSections] = useState<SidebarSection[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // Completed lesson IDs (for sidebar checkmarks)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-next: null = hidden, 0-5 = countdown in seconds
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  // Keep a stable ref to next lesson for event handlers that close over stale state
  const nextLessonRef = useRef<SidebarLesson | null>(null);
  // Stable ref to the current lesson — event handlers (postMessage, onEnded)
  // run in closures that would otherwise capture stale state.
  const lessonRef = useRef<Lesson | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated]);

  // ── Fetch lesson ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId || !isAuthenticated) return;
    setLoading(true);
    setStreamError(null);
    setAutoNextCountdown(null);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    fetchLesson();
  }, [lessonId, isAuthenticated]);

  // ── Fetch course sections for sidebar ─────────────────────────────────
  useEffect(() => {
    if (!lesson?.courseId) return;
    fetchProgress(lesson.courseId);
    if (courseSections.length === 0) fetchCourseSidebar(lesson.courseId);
    // Always refresh completed IDs so sidebar checkmarks are correct
    // on every lesson navigation (handles cross-tab completion too)
    fetchCompletedLessons(lesson.courseId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.courseId, lessonId]);

  // ── Load stream (iframe embed or HLS fallback) ─────────────────────────
  useEffect(() => {
    if (!lesson) return;
    setEmbedUrl(null);
    setStreamUrl(null);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    async function loadStream() {
      try {
        const { data } = await api.get(`/lessons/${lessonId}/stream`);
        if (data.embedUrl) {
          // Append enableApi=1 so the player fires postMessage "ended" events
          setEmbedUrl(addEnableApi(String(data.embedUrl).trim()));
          return;
        }
        if (data.streamUrl) setStreamUrl(data.streamUrl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[LessonViewer] loadStream error:', msg);
        if (msg.includes('سجّل') || msg.includes('التسجيل') || msg.includes('403')) {
          setStreamError('يجب التسجيل في الدورة أولاً للمشاهدة');
        } else if (msg.includes('متوفر') || msg.includes('404')) {
          setStreamError('الفيديو غير متوفر بعد — يتم تجهيزه');
        } else {
          setStreamError(msg || 'حدث خطأ في تحميل الفيديو');
        }
      }
    }
    loadStream();
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [lesson, lessonId]);

  // ── Attach HLS when we have a streamUrl (no embedUrl) ─────────────────
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) setStreamError('حدث خطأ في تحميل الفيديو'); });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else {
      setStreamError('المتصفح لا يدعم تشغيل الفيديو');
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [streamUrl]);

  // ── Auto-complete on video end ──────────────────────────────────────────
  // IMPORTANT: must be declared BEFORE any useEffect that references it in a
  // dependency array, otherwise JavaScript's Temporal Dead Zone (TDZ) causes
  // "Cannot access 'markLessonComplete' before initialization" → white screen.
  //
  // Idempotent — called by both Bunny iframe postMessage and HLS <video onEnded>.
  // Uses lessonRef so the closure always sees the latest lesson without stale state.

  const markLessonComplete = useCallback(async () => {
    const cur = lessonRef.current;
    if (!cur) return;

    console.log(`[Progress] markLessonComplete: lesson "${cur.title}" (${cur.id}), already completed = ${cur.completed}`);

    // Optimistic update
    setLesson((prev) => prev ? { ...prev, completed: true } : prev);
    setProgress((prev) => {
      if (!prev || cur.completed) return prev; // already counted — skip
      const completedLessons = Math.min(prev.totalLessons, prev.completedLessons + 1);
      const percentage = prev.totalLessons > 0
        ? Math.round((completedLessons / prev.totalLessons) * 100)
        : 0;
      console.log(`[Progress] Optimistic after video end → ${completedLessons}/${prev.totalLessons} = ${percentage}%`);
      return { ...prev, completedLessons, percentage };
    });
    setCompletedLessonIds((prev) => new Set([...prev, cur.id]));

    try {
      const { data } = await api.post(
        `/courses/${cur.courseId}/lessons/${cur.id}/complete`
      );
      console.log('[Progress] markLessonComplete API response →', data);

      setLesson((prev) =>
        prev ? { ...prev, completed: data.completed, completedAt: data.completedAt ?? undefined } : prev
      );
      if (data.progress) {
        console.log('[Progress] Server progress after video end →', data.progress);
        setProgress(data.progress);
      }
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        if (data.completed) next.add(cur.id);
        return next;
      });
    } catch (err) {
      console.error('[Progress] markLessonComplete API error:', err);
    }
  // lessonRef is a ref — stable, intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Trigger auto-next countdown ────────────────────────────────────────
  // Also declared before useEffect deps arrays that reference it.

  const triggerAutoNext = useCallback(() => {
    if (!nextLessonRef.current) return;
    setAutoNextCountdown(5);
  }, []);

  // ── Listen for Bunny iframe postMessage "ended" event ─────────────────
  // markLessonComplete and triggerAutoNext are declared above — safe to use here.
  useEffect(() => {
    if (!embedUrl) return;
    const handleMessage = (e: MessageEvent) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Log every postMessage so we can see what Bunny is sending
        if (d && typeof d === 'object') {
          console.log('[Player] Bunny postMessage:', JSON.stringify(d));
        }
        if (d?.event === 'ended' || d?.type === 'ended') {
          console.log('[Player] ✅ Bunny video ended — auto-completing lesson');
          markLessonComplete();
          triggerAutoNext();
        }
      } catch { /* ignore parse errors */ }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embedUrl, markLessonComplete, triggerAutoNext]);

  // ── Auto-next countdown tick ───────────────────────────────────────────
  useEffect(() => {
    if (autoNextCountdown === null) return;
    if (autoNextCountdown <= 0) {
      const next = nextLessonRef.current;
      if (next) navigate(`/lesson-viewer/${next.id}`);
      setAutoNextCountdown(null);
      return;
    }
    const t = setTimeout(() => setAutoNextCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [autoNextCountdown, navigate]);

  // ── Data fetchers ──────────────────────────────────────────────────────

  const fetchLesson = async () => {
    try {
      const { data } = await api.get(`/lessons/${lessonId}`);
      setLesson(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('سجّل') || msg.includes('التسجيل') || msg.includes('403')) {
        setStreamError('يجب التسجيل في الدورة أولاً للمشاهدة');
      } else {
        setStreamError(msg || 'تعذّر تحميل بيانات الدرس');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (courseId: string) => {
    try {
      const { data } = await api.get(`/courses/${courseId}/progress`);
      console.log('[Progress] fetchProgress →', data);
      if (!data || typeof data.totalLessons === 'undefined') {
        console.warn('[Progress] ⚠ fetchProgress: unexpected response shape', data);
      }
      setProgress(data);
    } catch (err) {
      console.error('[Progress] fetchProgress error:', err);
    }
  };

  const fetchCompletedLessons = async (courseId: string) => {
    try {
      const { data } = await api.get(`/courses/${courseId}/completed-lessons`);
      const ids: string[] = data.completedLessonIds ?? [];
      console.log(`[Progress] fetchCompletedLessons → ${ids.length} completed:`, ids);
      setCompletedLessonIds(new Set<string>(ids));
    } catch (err) {
      console.error('[Progress] fetchCompletedLessons error:', err);
    }
  };

  const fetchCourseSidebar = async (courseId: string) => {
    setSidebarLoading(true);
    try {
      const { data: courseData } = await api.get(`/courses/${courseId}`);
      setCourseInfo({ id: courseData.id, title: courseData.title });

      const sections: SidebarSection[] = [];
      const expandAll = new Set<string>();

      for (const section of courseData.sections ?? []) {
        const { data: lessonsData } = await api.get(`/sections/${section.id}/lessons`);
        sections.push({ ...section, lessons: lessonsData.lessons ?? [] });
        expandAll.add(section.id);
      }

      setCourseSections(sections);
      setExpandedSections(expandAll);
    } catch (err) {
      console.error('Failed to load course sidebar:', err);
    } finally {
      setSidebarLoading(false);
    }
  };

  // ── Completion toggle (manual button) ─────────────────────────────────

  const handleToggleCompletion = async () => {
    if (!lesson || toggling) return;
    setToggling(true);

    const wasCompleted = lesson.completed;
    const nowCompleted = !wasCompleted;
    console.log(`[Progress] handleToggleCompletion: ${wasCompleted ? 'un-completing' : 'completing'} lesson "${lesson.title}" (${lesson.id})`);

    // ── Optimistic update ─────────────────────────────────────────────
    setLesson((prev) => prev ? { ...prev, completed: nowCompleted } : prev);
    setProgress((prev) => {
      if (!prev) return prev;
      const delta = nowCompleted ? 1 : -1;
      const completedLessons = Math.max(0, Math.min(prev.totalLessons, prev.completedLessons + delta));
      const percentage = prev.totalLessons > 0 ? Math.round((completedLessons / prev.totalLessons) * 100) : 0;
      console.log(`[Progress] Optimistic update → ${completedLessons}/${prev.totalLessons} = ${percentage}%`);
      return { ...prev, completedLessons, percentage };
    });
    setCompletedLessonIds((prev) => {
      const next = new Set(prev);
      if (nowCompleted) next.add(lesson.id); else next.delete(lesson.id);
      return next;
    });

    try {
      const { data } = await api.post(
        `/courses/${lesson.courseId}/lessons/${lesson.id}/complete`
      );
      console.log('[Progress] toggle API response →', data);

      setLesson((prev) =>
        prev ? { ...prev, completed: data.completed, completedAt: data.completedAt ?? undefined } : prev
      );
      if (data.progress) {
        console.log('[Progress] Server progress →', data.progress);
        setProgress(data.progress);
      }
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        if (data.completed) next.add(lesson.id); else next.delete(lesson.id);
        return next;
      });
    } catch (err) {
      console.error('[Progress] toggle API error:', err);
      // Roll back optimistic update
      setLesson((prev) => prev ? { ...prev, completed: wasCompleted } : prev);
      setProgress((prev) => {
        if (!prev) return prev;
        const delta = wasCompleted ? 1 : -1;
        const completedLessons = Math.max(0, Math.min(prev.totalLessons, prev.completedLessons + delta));
        const percentage = prev.totalLessons > 0 ? Math.round((completedLessons / prev.totalLessons) * 100) : 0;
        return { ...prev, completedLessons, percentage };
      });
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(lesson.id); else next.delete(lesson.id);
        return next;
      });
    } finally {
      setToggling(false);
    }
  };

  // ── (markLessonComplete and triggerAutoNext are declared above the
  //     Bunny postMessage useEffect — see ~line 181 — to avoid TDZ crash)

  const cancelAutoNext = () => setAutoNextCountdown(null);

  // ── Prev / next navigation ─────────────────────────────────────────────

  const flatLessons = useMemo(
    () => courseSections.flatMap((s) => s.lessons),
    [courseSections]
  );
  const currentIdx = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

  // Keep refs up-to-date for event handler closures
  useEffect(() => { nextLessonRef.current = nextLesson; }, [nextLesson]);
  useEffect(() => { lessonRef.current = lesson; }, [lesson]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <StudyHeader courseInfo={null} onToggleSidebar={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">جاري التحميل...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <StudyHeader courseInfo={null} onToggleSidebar={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto" />
            <p className="text-slate-300">الدرس غير موجود</p>
            <Link to="/courses" className="text-primary hover:underline text-sm">العودة للدورات</Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">

      {/* ── Study Header ──────────────────────────────────────────────── */}
      <StudyHeader
        courseInfo={courseInfo}
        lessonTitle={lesson.title}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />

      {/* ── Body: video area + sidebar ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Video + Controls ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto">

          {/* Video Player */}
          <div className="w-full bg-black">
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              {streamError ? (
                /* ── Stream / auth error ───────────────────────────── */
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-slate-900 px-6 text-center">
                  <XCircle size={44} className="text-red-400" />
                  <p className="text-slate-300 text-sm leading-relaxed">{streamError}</p>
                  {lesson?.courseId && (
                    <Link
                      to={`/course/${lesson.courseId}`}
                      className="mt-1 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      عرض تفاصيل الدورة
                    </Link>
                  )}
                </div>
              ) : !embedUrl && !streamUrl ? (
                /* ── Stream URL not yet resolved — show spinner ─────── */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-3">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">جاري تحميل الفيديو...</p>
                </div>
              ) : embedUrl ? (
                /* ── Bunny iframe embed ─────────────────────────────── */
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={lesson?.title ?? 'درس'}
                  loading="lazy"
                />
              ) : (
                /* ── HLS fallback ───────────────────────────────────── */
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  className="absolute inset-0 w-full h-full"
                  controlsList="nodownload"
                  onEnded={() => {
                    console.log('[Player] ✅ HLS video ended — auto-completing lesson');
                    markLessonComplete();
                    triggerAutoNext();
                  }}
                >
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              )}
            </div>
          </div>

          {/* Lesson Info Panel */}
          <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-4xl w-full mx-auto">

            {/* Title + Completion Button */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-white text-xl sm:text-2xl font-bold leading-snug">{lesson.title}</h1>
                {lesson.duration > 0 && (
                  <p className="text-slate-400 text-sm mt-1">
                    المدة: {formatDuration(lesson.duration)}
                  </p>
                )}
              </div>

              <button
                onClick={handleToggleCompletion}
                disabled={toggling}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-50 ${
                  lesson.completed
                    ? 'bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-red-900/20 hover:text-red-400 hover:border-red-600/40'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={lesson.completed ? 'اضغط لإلغاء الاكتمال' : 'اضغط لتعليم الدرس مكتملاً'}
              >
                {toggling ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={17} />
                )}
                <span>{lesson.completed ? 'مكتمل ✓' : 'علّم كمكتمل'}</span>
              </button>
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">تقدمك في الدورة</span>
                  <span className="text-green-400 font-semibold">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {progress.completedLessons} من {progress.totalLessons} درس مكتمل
                </p>
              </div>
            )}

            {/* Prev / Next Navigation */}
            <div className="flex items-center gap-3 pb-6">
              <button
                disabled={!prevLesson}
                onClick={() => prevLesson && navigate(`/lesson-viewer/${prevLesson.id}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
                الدرس السابق
              </button>

              <Link
                to={`/course-viewer/${lesson.courseId}`}
                className="flex-1 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                قائمة الدورة
              </Link>

              <button
                disabled={!nextLesson}
                onClick={() => nextLesson && navigate(`/lesson-viewer/${nextLesson.id}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                الدرس التالي
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Lesson Sidebar ──────────────────────────────────── */}
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-80 border-l border-slate-800 bg-slate-900 flex-shrink-0">
          <SidebarContent
            courseInfo={courseInfo}
            courseSections={courseSections}
            sidebarLoading={sidebarLoading}
            activeLessonId={lessonId ?? ''}
            expandedSections={expandedSections}
            completedLessonIds={completedLessonIds}
            onToggleSection={toggleSection}
            progress={progress}
          />
        </aside>

        {/* Mobile slide-over sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative mr-auto w-80 max-w-full flex flex-col bg-slate-900 h-full shadow-2xl">
              <SidebarContent
                courseInfo={courseInfo}
                courseSections={courseSections}
                sidebarLoading={sidebarLoading}
                activeLessonId={lessonId ?? ''}
                expandedSections={expandedSections}
                completedLessonIds={completedLessonIds}
                onToggleSection={toggleSection}
                progress={progress}
                onClose={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}
      </div>

      {/* ── Auto-Next Overlay ──────────────────────────────────────────── */}
      {autoNextCountdown !== null && nextLesson && (
        <AutoNextToast
          nextLesson={nextLesson}
          countdown={autoNextCountdown}
          onCancel={cancelAutoNext}
          onGoNow={() => navigate(`/lesson-viewer/${nextLesson.id}`)}
        />
      )}
    </div>
  );
}

// ── Auto-Next Toast ───────────────────────────────────────────────────────────

function AutoNextToast({
  nextLesson,
  countdown,
  onCancel,
  onGoNow,
}: {
  nextLesson: SidebarLesson;
  countdown: number;
  onCancel: () => void;
  onGoNow: () => void;
}) {
  const circumference = 2 * Math.PI * 18; // r=18
  const offset = circumference * (countdown / 5);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
        {/* Countdown ring */}
        <div className="relative flex-shrink-0 w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#334155" strokeWidth="3" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="#22c55e" strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
            {countdown}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs mb-0.5">الدرس التالي</p>
          <p className="text-white text-sm font-medium truncate">{nextLesson.title}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={onGoNow}
            className="flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <SkipForward size={13} />
            <span>الآن</span>
          </button>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StudyHeader({
  courseInfo,
  lessonTitle,
  onToggleSidebar,
  sidebarOpen,
}: {
  courseInfo: CourseInfo | null;
  lessonTitle?: string;
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}) {
  return (
    <header className="flex items-center gap-3 px-4 h-14 bg-slate-950 border-b border-slate-800 flex-shrink-0 z-10">
      {courseInfo && (
        <Link
          to={`/course-viewer/${courseInfo.id}`}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0"
        >
          <ArrowRight size={16} />
          <span className="hidden sm:inline max-w-[140px] truncate">{courseInfo.title}</span>
        </Link>
      )}
      {lessonTitle && (
        <>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span className="text-slate-300 text-sm truncate flex-1">{lessonTitle}</span>
        </>
      )}
      {!courseInfo && <div className="flex-1" />}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0 mr-auto"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        <span className="text-xs">القائمة</span>
      </button>
    </header>
  );
}

function SidebarContent({
  courseInfo,
  courseSections,
  sidebarLoading,
  activeLessonId,
  expandedSections,
  completedLessonIds,
  onToggleSection,
  progress,
  onClose,
}: {
  courseInfo: CourseInfo | null;
  courseSections: SidebarSection[];
  sidebarLoading: boolean;
  activeLessonId: string;
  expandedSections: Set<string>;
  completedLessonIds: Set<string>;
  onToggleSection: (id: string) => void;
  progress: Progress | null;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen size={16} className="text-primary flex-shrink-0" />
            <span className="text-white text-sm font-semibold truncate">
              {courseInfo?.title ?? 'محتوى الدورة'}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-white flex-shrink-0">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Mini progress */}
        {progress && (
          <div className="mt-2.5 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{progress.completedLessons}/{progress.totalLessons} درس</span>
              <span className="text-green-400">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto">
        {sidebarLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courseSections.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">لا توجد دروس بعد</div>
        ) : (
          courseSections.map((section, sIdx) => {
            const isOpen = expandedSections.has(section.id);
            // How many lessons in this section are completed?
            const sectionCompleted = section.lessons.filter((l) => completedLessonIds.has(l.id)).length;
            const sectionTotal = section.lessons.length;

            return (
              <div key={section.id} className="border-b border-slate-800">
                {/* Section header */}
                <button
                  onClick={() => onToggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-800/60 transition-colors text-start"
                >
                  <span className="text-slate-500 text-xs font-semibold w-5 flex-shrink-0">
                    {sIdx + 1}
                  </span>
                  <span className="text-slate-200 text-sm font-medium flex-1 truncate">
                    {section.title}
                  </span>
                  {/* Mini section progress badge */}
                  {sectionTotal > 0 && (
                    <span className={`text-xs flex-shrink-0 font-medium mr-1 ${
                      sectionCompleted === sectionTotal ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {sectionCompleted}/{sectionTotal}
                    </span>
                  )}
                  <span
                    className="text-slate-600 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    <ChevronDown size={15} />
                  </span>
                </button>

                {/* Lesson rows */}
                {isOpen && (
                  <div>
                    {section.lessons.map((l, lIdx) => {
                      const isActive    = l.id === activeLessonId;
                      const isCompleted = completedLessonIds.has(l.id);

                      return (
                        <Link
                          key={l.id}
                          to={`/lesson-viewer/${l.id}`}
                          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors border-t border-slate-800/50 ${
                            isActive ? 'bg-primary/10 border-r-2 border-r-primary' : ''
                          }`}
                        >
                          {/* Status icon */}
                          <div className="flex-shrink-0">
                            {isActive ? (
                              <PlayCircle size={16} className="text-primary" />
                            ) : isCompleted ? (
                              <CheckCircle size={15} className="text-green-500" />
                            ) : (
                              <Circle size={14} className="text-slate-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${
                              isActive    ? 'text-white font-medium' :
                              isCompleted ? 'text-slate-300'         :
                                            'text-slate-400'
                            }`}>
                              {lIdx + 1}. {l.title}
                            </p>
                            {l.duration > 0 && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                {formatDuration(l.duration)}
                              </p>
                            )}
                          </div>

                          {/* Completed badge (right side) */}
                          {isCompleted && !isActive && (
                            <span className="text-green-600 flex-shrink-0" title="مكتمل">
                              <CheckCircle size={13} />
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
