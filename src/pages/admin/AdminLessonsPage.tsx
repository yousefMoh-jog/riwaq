import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Plus, Edit, Trash2, X, Upload, CheckCircle, Clock,
  VideoOff, Filter, ChevronDown, Loader2, RotateCcw, Video, Paperclip,
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
  attachment_url?: string | null;
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
  attachmentUrl: string;
}

interface FormErrors {
  title?: string;
  sectionId?: string;
  duration?: string;
  orderIndex?: string;
}

const EMPTY_FORM: LessonFormData = { courseId: '', title: '', sectionId: '', duration: '', orderIndex: '', attachmentUrl: '' };

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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
        <Loader2 size={11} className="animate-spin" />
        {uploadState.progress > 0 ? `${uploadState.progress}%` : 'جاري الرفع...'}
      </span>
    );
  }
  if (uploadState?.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30">
        <X size={11} /> فشل الرفع
      </span>
    );
  }
  if (videoStatus === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">
        <CheckCircle size={11} /> جاهز
      </span>
    );
  }
  if (videoStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
        <Clock size={11} className="animate-pulse" /> جاري المعالجة...
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600">
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
        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${state.progress}%` }} />
        </div>
      )}
      <p className={`text-xs ${state.status === 'done' ? 'text-green-600 dark:text-green-400' : state.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
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

  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [modalVideoFile, setModalVideoFile] = useState<File | null>(null);
  const modalFileRef = useRef<HTMLInputElement>(null);

  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const rowFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentProgress, setAttachmentProgress]   = useState(0);
  const [attachmentError, setAttachmentError]         = useState<string | null>(null);
  const attachmentFileRef = useRef<HTMLInputElement>(null);

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

  // ── Upload helpers ────────────────────────────────────────────────────────

  const setUploadState = (lessonId: string, update: Partial<UploadState>) =>
    setUploadStates((prev) => ({
      ...prev,
      [lessonId]: { progress: 0, status: 'idle', message: '', ...prev[lessonId], ...update },
    }));

  const startVideoUpload = async (lessonId: string, file: File) => {
    setUploadState(lessonId, { status: 'uploading', progress: 0, message: 'جاري رفع الفيديو...' });
    try {
      const form = new FormData();
      form.append('video', file);
      await api.post(`/admin/lessons/${lessonId}/upload-video`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
        timeout: 0,
      });
      setUploadState(lessonId, { status: 'done', progress: 100, message: 'تم الرفع — جاري المعالجة على Bunny' });
      setLessons((prev) =>
        prev.map((l) => l.id === lessonId ? { ...l, video_status: 'pending' } : l)
      );
    } catch (err: unknown) {
      const serverMsg =
        (err as { response?: { data?: { messageAr?: string } } })?.response?.data?.messageAr;
      const networkMsg = err instanceof Error ? err.message : 'فشل رفع الفيديو';
      setUploadState(lessonId, { status: 'error', progress: 0, message: serverMsg ?? networkMsg });
    }
  };

  const handleAttachmentUpload = async (lessonId: string, file: File | null) => {
    if (!file) return;
    setAttachmentUploading(true);
    setAttachmentError(null);
    setAttachmentProgress(0);
    try {
      const form = new FormData();
      form.append('attachment', file);
      const { data } = await api.post(`/admin/lessons/${lessonId}/upload-attachment`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          if (progressEvent.total) {
            const pct = Math.min(99, Math.round((progressEvent.loaded / progressEvent.total) * 100));
            setAttachmentProgress(pct);
          }
        },
      });
      setAttachmentProgress(100);
      setFormData((prev) => ({ ...prev, attachmentUrl: data.url }));
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : null) ?? 'فشل رفع الملف';
      setAttachmentError(msg);
      setAttachmentProgress(0);
    } finally {
      setAttachmentUploading(false);
      if (attachmentFileRef.current) attachmentFileRef.current.value = '';
    }
  };

  const handleRowUploadClick = (lessonId: string) => rowFileRefs.current[lessonId]?.click();
  const handleRowFileChange = async (lessonId: string, file: File | null) => {
    if (!file) return;
    await startVideoUpload(lessonId, file);
  };

  // ── Form submit ───────────────────────────────────────────────────────────

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
        ...(editingLesson ? { attachmentUrl: formData.attachmentUrl.trim() } : {}),
      };
      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson.id}`, payload);
        await fetchLessons();
        handleCloseModal();
        return;
      }
      const { data } = await api.post('/admin/lessons', payload);
      const raw = data.lesson;
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
      if (fileToUpload) startVideoUpload(raw.id, fileToUpload);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { messageAr?: string } } })?.response?.data?.messageAr
        ?? 'حدث خطأ أثناء الحفظ.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    const parentSection = sections.find((s) => s.id === lesson.section_id);
    setFormData({
      courseId: lesson.course_id ?? parentSection?.course_id ?? '',
      title: lesson.title,
      sectionId: lesson.section_id,
      duration: lesson.duration ? String(lesson.duration) : '',
      orderIndex: String(lesson.sort_order),
      attachmentUrl: lesson.attachment_url ?? '',
    });
    setFormErrors({});
    setServerError(null);
    setAttachmentError(null);
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
    setAttachmentError(null);
    setAttachmentProgress(0);
    if (modalFileRef.current) modalFileRef.current.value = '';
    if (attachmentFileRef.current) attachmentFileRef.current.value = '';
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

  /* ── Shared input/select classes ─────────────────────────────────────────── */
  const inputBase = 'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B2F82]/30 dark:focus:ring-[#8478C9]/30 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400';
  const inputNormal = `${inputBase} border-gray-200 dark:border-slate-600`;
  const inputError  = `${inputBase} border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1 text-gray-900 dark:text-white">إدارة الدروس</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              الإجمالي: {lessons.length}{hasActiveFilters && ` · مُعروض: ${filteredLessons.length}`}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-[#3B2F82] dark:bg-[#8478C9] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} /> إضافة درس جديد
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm theme-transition">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
            <Filter size={15} /><span>تصفية:</span>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm appearance-none bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B2F82]/30 dark:focus:ring-[#8478C9]/30"
            >
              <option value="">كل الدورات</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <select
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value)}
              disabled={filteredSections.length === 0}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm appearance-none bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B2F82]/30 dark:focus:ring-[#8478C9]/30 disabled:opacity-50"
            >
              <option value="">كل الأقسام</option>
              {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCourseId(''); setFilterSectionId(''); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw size={13} /> إعادة تعيين
            </button>
          )}
        </div>

        {/* Lessons */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-slate-500 gap-2">
            <Loader2 size={20} className="animate-spin" /><span>جاري التحميل...</span>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 dark:text-slate-500">
            <VideoOff size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">لا توجد دروس</p>
            {hasActiveFilters && <p className="text-sm mt-1">جرّب تغيير الفلاتر أو إضافة درس جديد.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ courseTitle, sections: grpSections }) => (
              <div key={courseTitle} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden theme-transition">
                {/* Course header row */}
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{courseTitle}</h3>
                </div>
                {grpSections.map(({ sectionTitle, lessons: sl }) => (
                  <div key={sectionTitle}>
                    {/* Section sub-header */}
                    <div className="px-5 py-2 bg-gray-50/50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8478C9]" />
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{sectionTitle}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">({sl.length})</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/50">
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 dark:text-slate-500 w-10">#</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 dark:text-slate-500">العنوان</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 dark:text-slate-500 hidden sm:table-cell">المدة</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 dark:text-slate-500">حالة الفيديو</th>
                            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 dark:text-slate-500">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {sl.map((lesson) => {
                            const up = uploadStates[lesson.id];
                            const isUploading = up && ['signing','uploading','registering'].includes(up.status);
                            return (
                              <tr key={lesson.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors">
                                <td className="px-5 py-3 text-center">
                                  <span className="text-xs text-gray-400 dark:text-slate-500 font-mono bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                    {lesson.sort_order}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{lesson.title}</td>
                                <td className="px-5 py-3 text-xs text-gray-400 dark:text-slate-500 hidden sm:table-cell">
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
                                    <input
                                      type="file" accept="video/*" className="hidden"
                                      ref={(el) => { rowFileRefs.current[lesson.id] = el; }}
                                      onChange={(e) => handleRowFileChange(lesson.id, e.target.files?.[0] ?? null)}
                                    />
                                    <button
                                      onClick={() => handleRowUploadClick(lesson.id)}
                                      disabled={isUploading}
                                      title="رفع فيديو"
                                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400 disabled:opacity-40"
                                    >
                                      {isUploading
                                        ? <Loader2 size={16} className="animate-spin" />
                                        : <Upload size={16} />}
                                    </button>
                                    <button onClick={() => handleEdit(lesson)} title="تعديل" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400">
                                      <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(lesson.id)} title="حذف" className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400">
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto theme-transition">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {editingLesson ? 'عدّل البيانات ثم اضغط حفظ' : 'اختر الفيديو الآن وسيُرفع تلقائياً عند الإضافة'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 dark:text-slate-400">
                <X size={18} />
              </button>
            </div>

            {serverError && (
              <div className="mx-6 mt-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Course */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">الدورة</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className={inputNormal}
                >
                  <option value="">— اختر الدورة (لتصفية الأقسام) —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  القسم <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => { setFormData({ ...formData, sectionId: e.target.value }); if (formErrors.sectionId) setFormErrors({ ...formErrors, sectionId: undefined }); }}
                  className={formErrors.sectionId ? inputError : inputNormal}
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
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  عنوان الدرس <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (formErrors.title) setFormErrors({ ...formErrors, title: undefined }); }}
                  placeholder="مثال: مقدمة في التفاضل والتكامل"
                  className={formErrors.title ? inputError : inputNormal}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Duration + Sort order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">المدة (ثواني)</label>
                  <input
                    type="number" min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="مثال: 600"
                    className={formErrors.duration ? inputError : inputNormal}
                  />
                  {formErrors.duration && <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                    الترتيب
                    {formData.sectionId && !editingLesson && (
                      <span className="text-xs text-gray-400 dark:text-slate-500 mr-1">(مقترح: {suggestedOrder})</span>
                    )}
                  </label>
                  <input
                    type="number" min="1"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                    placeholder={String(suggestedOrder)}
                    className={inputNormal}
                  />
                </div>
              </div>

              {/* ── Video File Picker (create mode only) ── */}
              {!editingLesson && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                    ملف الفيديو
                    <span className="text-xs text-gray-400 dark:text-slate-500 mr-2 font-normal">اختياري — يمكن رفعه لاحقاً</span>
                  </label>

                  <div
                    onClick={() => modalFileRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-4 transition-colors ${
                      modalVideoFile
                        ? 'border-[#8478C9]/50 bg-[#8478C9]/5 dark:bg-[#8478C9]/10'
                        : 'border-gray-200 dark:border-slate-600 hover:border-[#8478C9]/40 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {modalVideoFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8478C9]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Video size={18} className="text-[#8478C9]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{modalVideoFile.name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {(modalVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setModalVideoFile(null); if (modalFileRef.current) modalFileRef.current.value = ''; }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 dark:text-slate-500 flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    type="file" accept="video/*" className="hidden"
                    onChange={(e) => setModalVideoFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              {/* ── Attachment (edit mode only) ── */}
              {editingLesson && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                    رفع مادة الدرس
                    <span className="text-xs text-gray-400 dark:text-slate-500 mr-2 font-normal">PDF / ملفات</span>
                  </label>

                  {/* ── File picker zone ── */}
                  <div
                    onClick={() => !attachmentUploading && !formData.attachmentUrl && attachmentFileRef.current?.click()}
                    className={`rounded-xl p-4 border-2 border-dashed transition-colors ${
                      formData.attachmentUrl
                        ? 'border-[#8478C9]/40 bg-[#8478C9]/5 dark:bg-[#8478C9]/10 cursor-default'
                        : attachmentUploading
                          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 cursor-default'
                          : 'border-gray-200 dark:border-slate-600 hover:border-[#8478C9]/40 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer'
                    }`}
                  >
                    {/* State: file uploaded */}
                    {formData.attachmentUrl && !attachmentUploading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8478C9]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Paperclip size={18} className="text-[#8478C9]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {(() => {
                              try {
                                const path = formData.attachmentUrl.startsWith('http')
                                  ? new URL(formData.attachmentUrl).pathname
                                  : formData.attachmentUrl;
                                return decodeURIComponent(path.split('/').pop() ?? formData.attachmentUrl);
                              } catch {
                                return formData.attachmentUrl.split('/').pop() ?? formData.attachmentUrl;
                              }
                            })()}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">تم الرفع بنجاح</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, attachmentUrl: '' }); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 size={13} />
                          حذف
                        </button>
                      </div>
                    ) : attachmentUploading ? (
                      /* State: uploading */
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Loader2 size={18} className="text-blue-600 dark:text-blue-400 animate-spin" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">جاري رفع الملف...</p>
                          <div className="mt-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#8478C9] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${attachmentProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                            {attachmentProgress < 99 ? `${attachmentProgress}%` : 'اكتمل الرفع...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* State: empty — prompt to upload */
                      <div className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Paperclip size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
                            اضغط لرفع مادة الدرس (PDF / ملفات)
                          </p>
                          <p className="text-xs mt-0.5">
                            PDF، Word، PPT، Excel، ZIP — حتى 20 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={attachmentFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.zip,.rar"
                    className="hidden"
                    onChange={(e) => handleAttachmentUpload(editingLesson.id, e.target.files?.[0] ?? null)}
                  />

                  {attachmentError && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <X size={12} /> {attachmentError}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#3B2F82] dark:bg-[#8478C9] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2"
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
