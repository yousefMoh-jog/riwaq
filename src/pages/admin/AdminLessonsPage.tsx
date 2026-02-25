import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Plus, Edit, Trash2, X, Upload, CheckCircle, Clock,
  VideoOff, Filter, ChevronDown, Loader2, RotateCcw, Video,
} from 'lucide-react';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  section_id: string;
  section_title: string;
  course_id: string;
  course_title: string;
  duration: number;
  sort_order: number;
  video_status: 'pending' | 'ready' | null;
  bunny_video_id: string | null;
}

interface Section {
  id: string;
  title: string;
  course_id: string;
  course_title: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface UploadState {
  progress: number;
  status: UploadStatus;
  message: string;
}

interface LessonFormData {
  courseId: string;
  title: string;
  sectionId: string;
  duration: string;
  orderIndex: string;
}

interface FormErrors {
  title?: string;
  sectionId?: string;
  duration?: string;
  orderIndex?: string;
}

const EMPTY_FORM: LessonFormData = { courseId: '', title: '', sectionId: '', duration: '', orderIndex: '' };

// ── Sub-components ────────────────────────────────────────────────────────────

function VideoStatusBadge({
  videoStatus,
  uploadState,
}: {
  videoStatus: Lesson['video_status'];
  uploadState?: UploadState;
}) {
  if (uploadState?.status === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Loader2 size={11} className="animate-spin" />
        {uploadState.progress > 0 ? `${uploadState.progress}%` : 'جاري الرفع...'}
      </span>
    );
  }
  if (uploadState?.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <X size={11} /> فشل الرفع
      </span>
    );
  }
  if (videoStatus === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle size={11} /> جاهز
      </span>
    );
  }
  if (videoStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={11} className="animate-pulse" /> جاري المعالجة...
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
      <VideoOff size={11} /> لا يوجد فيديو
    </span>
  );
}

function UploadProgressBar({ state }: { state: UploadState }) {
  const isActive = state.status === 'uploading';
  if (!isActive && state.status !== 'done' && state.status !== 'error') return null;
  return (
    <div className="mt-1.5 space-y-1">
      {isActive && (
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${state.progress}%` }} />
        </div>
      )}
      <p className={`text-xs ${state.status === 'done' ? 'text-green-600' : state.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
        {state.message}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminLessonsPage() {
  const { user } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Video file picked inside the "Add Lesson" modal
  const [modalVideoFile, setModalVideoFile] = useState<File | null>(null);
  const modalFileRef = useRef<HTMLInputElement>(null);

  // Per-row upload progress (for both modal-triggered and manual uploads)
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const rowFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { Promise.all([fetchLessons(), fetchSections(), fetchCourses()]); }, []);
  useEffect(() => { setFilterSectionId(''); }, [filterCourseId]);
  useEffect(() => {
    if (!editingLesson) setFormData((p) => ({ ...p, sectionId: '' }));
  }, [formData.courseId]);

  if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') return <Navigate to="/dashboard" replace />;

  // ── Data ──────────────────────────────────────────────────────────────────

  const fetchLessons = async () => {
    try {
      const { data } = await api.get('/admin/lessons');
      setLessons(data.lessons || []);
    } finally { setLoading(false); }
  };
  const fetchSections = async () => {
    try { const { data } = await api.get('/admin/sections'); setSections(data.sections || []); } catch { /**/ }
  };
  const fetchCourses = async () => {
    try { const { data } = await api.get('/admin/courses'); setCourses(data.courses || []); } catch { /**/ }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredSections = useMemo(
    () => sections.filter((s) => !filterCourseId || s.course_id === filterCourseId),
    [sections, filterCourseId]
  );

  const filteredLessons = useMemo(
    () => lessons.filter((l) =>
      (!filterCourseId || l.course_id === filterCourseId) &&
      (!filterSectionId || l.section_id === filterSectionId)
    ),
    [lessons, filterCourseId, filterSectionId]
  );

  const formSections = useMemo(
    () => sections.filter((s) => !formData.courseId || s.course_id === formData.courseId),
    [sections, formData.courseId]
  );

  const suggestedOrder = useMemo(() => {
    if (!formData.sectionId) return 1;
    const sl = lessons.filter((l) => l.section_id === formData.sectionId);
    return sl.length === 0 ? 1 : Math.max(...sl.map((l) => l.sort_order)) + 1;
  }, [lessons, formData.sectionId]);

  type GroupedData = { courseTitle: string; sections: { sectionTitle: string; lessons: Lesson[] }[] }[];
  const grouped = useMemo((): GroupedData => {
    const map = new Map<string, Map<string, Lesson[]>>();
    for (const l of filteredLessons) {
      const ct = l.course_title || 'دورة غير محددة';
      const st = l.section_title || 'قسم غير محدد';
      if (!map.has(ct)) map.set(ct, new Map());
      const sm = map.get(ct)!;
      if (!sm.has(st)) sm.set(st, []);
      sm.get(st)!.push(l);
    }
    return Array.from(map.entries()).map(([courseTitle, sm]) => ({
      courseTitle,
      sections: Array.from(sm.entries()).map(([sectionTitle, ls]) => ({ sectionTitle, lessons: ls })),
    }));
  }, [filteredLessons]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3)
      errors.title = 'عنوان الدرس يجب أن يكون 3 أحرف على الأقل';
    if (!formData.sectionId) errors.sectionId = 'يجب اختيار القسم';
    if (formData.duration !== '' && (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) < 0))
      errors.duration = 'يجب أن تكون المدة رقماً صحيحاً';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Bunny upload (shared between modal-triggered and per-row) ─────────────

  const setUploadState = (lessonId: string, update: Partial<UploadState>) =>
    setUploadStates((prev) => ({
      ...prev,
      [lessonId]: { progress: 0, status: 'idle', message: '', ...prev[lessonId], ...update },
    }));

  // Upload a video file to our server, which streams it to Bunny using AccessKey
  // (server-side only). No CORS issues, no client-side signatures needed.
  const startVideoUpload = async (lessonId: string, file: File) => {
    setUploadState(lessonId, { status: 'uploading', progress: 0, message: 'جاري رفع الفيديو...' });
    try {
      const form = new FormData();
      form.append('video', file);

      await api.post(`/admin/lessons/${lessonId}/upload-video`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // onUploadProgress tracks browser→server upload (0→90%).
        // The remaining time (~90→100%) is the server streaming to Bunny.
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          if (progressEvent.total) {
            const pct = Math.min(90, Math.round((progressEvent.loaded / progressEvent.total) * 90));
            setUploadState(lessonId, {
              status: 'uploading',
              progress: pct,
              message: pct < 90 ? `جاري الرفع ${pct}%` : 'جاري الرفع إلى Bunny...',
            });
          }
        },
        timeout: 0, // No timeout — large video files take time
      });

      setUploadState(lessonId, { status: 'done', progress: 100, message: 'تم الرفع — جاري المعالجة على Bunny' });
      setLessons((prev) =>
        prev.map((l) => l.id === lessonId ? { ...l, video_status: 'pending' } : l)
      );
    } catch (err: unknown) {
      const serverMsg =
        (err as { response?: { data?: { messageAr?: string } } })?.response?.data?.messageAr;
      const networkMsg = err instanceof Error ? err.message : 'فشل رفع الفيديو';
      const finalMsg = serverMsg ?? networkMsg;
      console.error(`[UPLOAD] Video upload failed for lesson ${lessonId}:`, err);
      setUploadState(lessonId, { status: 'error', progress: 0, message: finalMsg });
    }
  };

  // Per-row manual upload (existing lessons without video)
  const handleRowUploadClick = (lessonId: string) => rowFileRefs.current[lessonId]?.click();

  const handleRowFileChange = async (lessonId: string, file: File | null) => {
    if (!file) return;
    await startVideoUpload(lessonId, file);
  };

  // ── Form submit (create or edit) ──────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        sectionId: formData.sectionId,
        duration: parseInt(formData.duration) || 0,
        orderIndex: parseInt(formData.orderIndex) || suggestedOrder,
      };

      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson.id}`, payload);
        await fetchLessons();
        handleCloseModal();
        return;
      }

      // ── Create path ──
      const { data } = await api.post('/admin/lessons', payload);
      const raw = data.lesson;

      // Optimistic row — modal closes immediately, upload progress shows in the row
      const parentSection = sections.find((s) => s.id === raw.section_id);
      const newRow: Lesson = {
        id: raw.id,
        title: raw.title_ar,
        section_id: raw.section_id,
        section_title: parentSection?.title ?? '',
        course_id: parentSection?.course_id ?? '',
        course_title: parentSection?.course_title ?? '',
        duration: raw.duration_seconds,
        sort_order: raw.sort_order,
        video_status: null,
        bunny_video_id: null,
      };
      setLessons((prev) => [...prev, newRow]);

      const fileToUpload = modalVideoFile;
      handleCloseModal();

      // Fire-and-forget upload via our server proxy (no CORS / no signatures)
      if (fileToUpload) {
        startVideoUpload(raw.id, fileToUpload);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { messageAr?: string } } })?.response?.data?.messageAr
        ?? 'حدث خطأ أثناء الحفظ.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    const parentSection = sections.find((s) => s.id === lesson.section_id);
    setFormData({
      courseId: lesson.course_id ?? parentSection?.course_id ?? '',
      title: lesson.title,
      sectionId: lesson.section_id,
      duration: lesson.duration ? String(lesson.duration) : '',
      orderIndex: String(lesson.sort_order),
    });
    setFormErrors({});
    setServerError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try { await api.delete(`/admin/lessons/${id}`); await fetchLessons(); } catch { /**/ }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setServerError(null);
    setSubmitting(false);
    setModalVideoFile(null);
    if (modalFileRef.current) modalFileRef.current.value = '';
  };

  const handleOpenCreate = () => {
    setEditingLesson(null);
    setFormData({ ...EMPTY_FORM, courseId: filterCourseId, sectionId: filterSectionId });
    setFormErrors({});
    setServerError(null);
    setModalVideoFile(null);
    setShowModal(true);
  };

  const hasActiveFilters = !!filterCourseId || !!filterSectionId;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1">إدارة الدروس</h1>
            <p className="text-sm text-muted-foreground">
              الإجمالي: {lessons.length}{hasActiveFilters && ` · مُعروض: ${filteredLessons.length}`}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} /> إضافة درس جديد
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter size={15} /><span>تصفية:</span>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">كل الدورات</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <select
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value)}
              disabled={filteredSections.length === 0}
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">كل الأقسام</option>
              {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCourseId(''); setFilterSectionId(''); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <RotateCcw size={13} /> إعادة تعيين
            </button>
          )}
        </div>

        {/* Lessons */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 size={20} className="animate-spin" /><span>جاري التحميل...</span>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl text-muted-foreground">
            <VideoOff size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">لا توجد دروس</p>
            {hasActiveFilters && <p className="text-sm mt-1">جرّب تغيير الفلاتر أو إضافة درس جديد.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ courseTitle, sections: grpSections }) => (
              <div key={courseTitle} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                  <h3 className="text-sm font-semibold">{courseTitle}</h3>
                </div>
                {grpSections.map(({ sectionTitle, lessons: sl }) => (
                  <div key={sectionTitle}>
                    <div className="px-5 py-2 bg-muted/20 border-b border-border flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      <span className="text-xs font-medium text-muted-foreground">{sectionTitle}</span>
                      <span className="text-xs text-muted-foreground/60">({sl.length})</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/10">
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground w-10">#</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">العنوان</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">المدة</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">حالة الفيديو</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sl.map((lesson) => {
                            const up = uploadStates[lesson.id];
                            const isUploading = up && ['signing','uploading','registering'].includes(up.status);
                            return (
                              <tr key={lesson.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-5 py-3 text-center">
                                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                    {lesson.sort_order}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-sm font-medium">{lesson.title}</td>
                                <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                                  {lesson.duration
                                    ? `${Math.floor(lesson.duration / 60)} د ${lesson.duration % 60} ث`
                                    : '—'}
                                </td>
                                <td className="px-5 py-3">
                                  <VideoStatusBadge videoStatus={lesson.video_status} uploadState={up} />
                                  {up && <UploadProgressBar state={up} />}
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-1">
                                    {/* Hidden per-row file input for manual re-upload */}
                                    <input
                                      type="file" accept="video/*" className="hidden"
                                      ref={(el) => { rowFileRefs.current[lesson.id] = el; }}
                                      onChange={(e) => handleRowFileChange(lesson.id, e.target.files?.[0] ?? null)}
                                    />
                                    <button
                                      onClick={() => handleRowUploadClick(lesson.id)}
                                      disabled={isUploading}
                                      title="رفع فيديو"
                                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 disabled:opacity-40"
                                    >
                                      {isUploading
                                        ? <Loader2 size={16} className="animate-spin" />
                                        : <Upload size={16} />}
                                    </button>
                                    <button onClick={() => handleEdit(lesson)} title="تعديل" className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                                      <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(lesson.id)} title="حذف" className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold">{editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingLesson ? 'عدّل البيانات ثم اضغط حفظ' : 'اختر الفيديو الآن وسيُرفع تلقائياً عند الإضافة'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            {serverError && (
              <div className="mx-6 mt-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Course (for filtering sections dropdown) */}
              <div>
                <label className="block text-sm font-medium mb-1.5">الدورة</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— اختر الدورة (لتصفية الأقسام) —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  القسم <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => {
                    setFormData({ ...formData, sectionId: e.target.value });
                    if (formErrors.sectionId) setFormErrors({ ...formErrors, sectionId: undefined });
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.sectionId ? 'border-red-400 bg-red-50' : 'border-border'}`}
                >
                  <option value="">— اختر القسم —</option>
                  {formSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}{!formData.courseId ? ` — ${s.course_title}` : ''}
                    </option>
                  ))}
                </select>
                {formErrors.sectionId && <p className="text-red-500 text-xs mt-1">{formErrors.sectionId}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  عنوان الدرس <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                  }}
                  placeholder="مثال: مقدمة في التفاضل والتكامل"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.title ? 'border-red-400 bg-red-50' : 'border-border'}`}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Duration + Sort order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">المدة (ثواني)</label>
                  <input
                    type="number" min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="مثال: 600"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.duration ? 'border-red-400 bg-red-50' : 'border-border'}`}
                  />
                  {formErrors.duration && <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    الترتيب
                    {formData.sectionId && !editingLesson && (
                      <span className="text-xs text-muted-foreground mr-1">(مقترح: {suggestedOrder})</span>
                    )}
                  </label>
                  <input
                    type="number" min="1"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                    placeholder={String(suggestedOrder)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* ── Video File Picker (create mode only) ── */}
              {!editingLesson && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ملف الفيديو
                    <span className="text-xs text-muted-foreground mr-2 font-normal">اختياري — يمكن رفعه لاحقاً</span>
                  </label>

                  <div
                    onClick={() => modalFileRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-4 transition-colors ${
                      modalVideoFile
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/20'
                    }`}
                  >
                    {modalVideoFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Video size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{modalVideoFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(modalVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalVideoFile(null);
                            if (modalFileRef.current) modalFileRef.current.value = '';
                          }}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Upload size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">اضغط لاختيار ملف الفيديو</p>
                          <p className="text-xs mt-0.5">MP4، MOV، AVI — الرفع يبدأ تلقائياً عند إضافة الدرس</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={modalFileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setModalVideoFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /><span>جاري الحفظ...</span></>
                  ) : (
                    <span>
                      {editingLesson
                        ? 'حفظ التعديلات'
                        : modalVideoFile ? 'إضافة الدرس ورفع الفيديو' : 'إضافة الدرس'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
