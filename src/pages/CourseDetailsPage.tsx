import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { educationalLevelLabel } from '../lib/utils';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { RiwaqFooter } from '../app/components/RiwaqFooter';
import {
  BookOpen, CheckCircle, Lock, ChevronDown, ChevronUp,
  Users, PlayCircle, ArrowLeft, Star, MessageSquare, Send,
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  lessonsCount: number;
}

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
}

interface RatingsData {
  ratings: Rating[];
  average: number;
  total: number;
  distribution: { star: number; count: number }[];
}

// ── Star component ──────────────────────────────────────────────────────────

function StarRow({
  value,
  interactive = false,
  onChange,
  size = 20,
}: {
  value: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const effective = hovered || value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`focus:outline-none ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={`transition-colors ${effective >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-100'}`}
          />
        </button>
      ))}
    </div>
  );
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  educational_level: string;
  sections: Section[];
  totalLessons: number;
  isEnrolled: boolean;
  category_name?: string;
  thumbnail_url?: string;
}

interface Progress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export function CourseDetailsPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Ratings state
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
    fetchRatings();
    if (isAuthenticated) {
      fetchProgress();
      checkEnrollment();
    }
  }, [courseId, isAuthenticated]);

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}`);
      setCourse(data);
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}/enrolled`);
      setEnrolled(data.enrolled);
    } catch { /* non-fatal */ }
  };

  const fetchProgress = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}/progress`);
      setProgress(data);
    } catch { /* non-fatal */ }
  };

  const fetchRatings = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}/ratings`);
      setRatingsData(data);
    } catch { /* non-fatal */ }
  };

  const handleSubmitRating = async () => {
    if (!myRating) return;
    setRatingSubmitting(true);
    try {
      await api.post(`/courses/${courseId}/ratings`, { rating: myRating, comment: myComment });
      setRatingSuccess(true);
      fetchRatings(); // refresh list
      setTimeout(() => setRatingSuccess(false), 3000);
    } catch { /* ignore */ }
    finally { setRatingSubmitting(false); }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Loading / Error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <RiwaqHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </main>
        <RiwaqFooter />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <RiwaqHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-xl text-muted-foreground">الدورة غير موجودة</p>
            <Link to="/courses" className="text-primary hover:underline text-sm">
              العودة للدورات
            </Link>
          </div>
        </main>
        <RiwaqFooter />
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const priceNum = parseFloat(String(course.price));
  const isFree = !isNaN(priceNum) && priceNum === 0;

  const PriceCtaButton = () => {
    if (!isAuthenticated) {
      return (
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white py-4 rounded-xl hover:bg-primary/90 transition-colors text-lg font-semibold"
        >
          سجّل الدخول للشراء
        </Link>
      );
    }
    if (enrolled) {
      return (
        <Link
          to={`/course-viewer/${course.id}`}
          className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors text-lg font-semibold"
        >
          <PlayCircle size={22} />
          الدخول للدورة
        </Link>
      );
    }
    return (
      <Link
        to={`/checkout/${course.id}`}
        className="flex items-center justify-center gap-2 w-full bg-primary text-white py-4 rounded-xl hover:bg-primary/90 transition-colors text-lg font-semibold"
      >
        {isFree ? 'التحق بالدورة مجاناً' : 'اشتر الدورة الآن'}
      </Link>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <RiwaqHeader />

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div
        className="relative bg-gradient-to-br from-slate-900 via-primary/90 to-primary text-white overflow-hidden"
      >
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            جميع الدورات
          </Link>

          <div className="lg:max-w-2xl">
            {course.category_name && (
              <span className="inline-block bg-white/15 text-white/90 text-xs px-3 py-1 rounded-full mb-3">
                {course.category_name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-white/75">
              <span className="flex items-center gap-1.5">
                <BookOpen size={15} />
                {course.totalLessons} درس
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} />
                {educationalLevelLabel(course.educational_level)}
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={15} />
                {course.sections.length} قسم
              </span>
              {enrolled && (
                <span className="flex items-center gap-1.5 bg-green-500/30 text-green-200 px-3 py-1 rounded-full">
                  <CheckCircle size={14} />
                  مسجّل
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main body ───────────────────────────────────────────────────── */}
      <main className="flex-1 bg-muted/30 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* ── Sticky Sidebar (shows first on mobile) ──────────────── */}
            <div className="order-first lg:order-last lg:col-span-1">
              <div className="sticky top-24 space-y-4">

                {/* Price Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
                  {course.thumbnail_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-primary">
                        {isFree ? 'مجاني' : course.price}
                      </span>
                      {!isFree && (
                        <span className="text-muted-foreground font-medium">د.ل</span>
                      )}
                    </div>

                    <PriceCtaButton />

                    {/* Progress for enrolled users */}
                    {enrolled && progress && (
                      <div className="pt-3 border-t border-border space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">تقدمك في الدورة</span>
                          <span className="font-semibold text-green-700">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {progress.completedLessons} من {progress.totalLessons} درس مكتمل
                        </p>
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="pt-3 border-t border-border space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">عدد الدروس</span>
                        <span className="font-medium">{course.totalLessons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الأقسام</span>
                        <span className="font-medium">{course.sections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المستوى</span>
                        <span className="font-medium">{educationalLevelLabel(course.educational_level)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main Content ────────────────────────────────────────── */}
            <div className="order-last lg:order-first lg:col-span-2 space-y-6">

              {/* Curriculum Accordion */}
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-xl font-semibold">محتوى الدورة</h2>
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {course.totalLessons} درس · {course.sections.length} قسم
                  </span>
                </div>

                {course.sections.length === 0 ? (
                  <div className="py-16 text-center">
                    <BookOpen size={40} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">لم تُضف دروس لهذه الدورة بعد</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {course.sections.map((section, idx) => {
                      const isOpen = expandedSections.has(section.id);
                      return (
                        <div key={section.id}>
                          {/* Section trigger */}
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors text-start"
                          >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{section.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {section.lessonsCount} {section.lessonsCount === 1 ? 'درس' : 'دروس'}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-muted-foreground transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                              <ChevronDown size={18} />
                            </span>
                          </button>

                          {/* Section content */}
                          {isOpen && (
                            <div className="bg-muted/20 border-t border-border">
                              {Array.from({ length: section.lessonsCount }).map((_, lessonIdx) => (
                                <div
                                  key={lessonIdx}
                                  className="flex items-center gap-3 px-6 py-3 border-b border-border/50 last:border-b-0"
                                >
                                  <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center flex-shrink-0">
                                    {enrolled ? (
                                      <PlayCircle size={14} className="text-primary" />
                                    ) : (
                                      <Lock size={12} className="text-muted-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {enrolled
                                      ? `الدرس ${lessonIdx + 1}`
                                      : `الدرس ${lessonIdx + 1} — محتوى مقفل`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Ratings & Reviews ─────────────────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" />
                    التقييمات والمراجعات
                  </h2>
                  {ratingsData && ratingsData.total > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRow value={Math.round(ratingsData.average)} size={16} />
                      <span className="font-bold text-foreground">{ratingsData.average}</span>
                      <span className="text-xs text-muted-foreground">({ratingsData.total})</span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Rating distribution bar */}
                  {ratingsData && ratingsData.total > 0 && (
                    <div className="space-y-1.5">
                      {ratingsData.distribution.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-3 text-sm">
                          <span className="w-4 text-muted-foreground text-left">{star}</span>
                          <Star size={13} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-yellow-400 h-full rounded-full"
                              style={{ width: ratingsData.total > 0 ? `${(count / ratingsData.total) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="w-5 text-muted-foreground text-left">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit rating form (enrolled users only) */}
                  {enrolled && (
                    <div className="bg-muted/40 rounded-xl p-5 space-y-3 border border-border">
                      <p className="font-semibold text-sm">
                        {user?.fullName ? `أضف تقييمك، ${user.fullName}` : 'أضف تقييمك'}
                      </p>
                      <StarRow value={myRating} interactive onChange={setMyRating} size={28} />
                      <textarea
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="شارك رأيك حول هذه الدورة... (اختياري)"
                        rows={3}
                        className="w-full resize-none bg-white border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex items-center justify-between">
                        {ratingSuccess && (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle size={14} /> تم إرسال تقييمك!
                          </span>
                        )}
                        <button
                          onClick={handleSubmitRating}
                          disabled={!myRating || ratingSubmitting}
                          className="mr-auto flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send size={14} />
                          {ratingSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reviews list */}
                  {ratingsData && ratingsData.ratings.length > 0 ? (
                    <div className="divide-y divide-border/60">
                      {ratingsData.ratings.map((r) => (
                        <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                                {(r.reviewer_name ?? 'ط').slice(0, 1)}
                              </div>
                              <span className="font-semibold text-sm">{r.reviewer_name ?? 'طالب'}</span>
                            </div>
                            <StarRow value={r.rating} size={14} />
                          </div>
                          {r.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed pr-10">{r.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground/60 pr-10 mt-1">
                            {new Date(r.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Star size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                      {enrolled
                        ? 'كن أول من يقيّم هذه الدورة!'
                        : 'لا توجد تقييمات لهذه الدورة حتى الآن'}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile CTA (shown on small screens below curriculum) */}
              <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-border p-6">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {isFree ? 'مجاني' : course.price}
                  </span>
                  {!isFree && <span className="text-muted-foreground">د.ل</span>}
                </div>
                <PriceCtaButton />
              </div>
            </div>
          </div>
        </div>
      </main>

      <RiwaqFooter />
    </div>
  );
}
