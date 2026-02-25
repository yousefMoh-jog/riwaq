import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Plus, Edit, Trash2, X, Loader2, BookOpen } from 'lucide-react';

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

interface FormData {
  title: string;
  courseId: string;
  orderIndex: string;
}

interface FormErrors {
  title?: string;
  courseId?: string;
}

const EMPTY_FORM: FormData = { title: '', courseId: '', orderIndex: '' };

export function AdminSectionsPage() {
  const { user } = useAuth();
  const location = useLocation();

  // When redirected from course creation, state carries { courseId, courseTitle }
  const routeState = location.state as { courseId?: string; courseTitle?: string } | null;
  const autoOpenHandled = useRef(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchSections(), fetchCourses()]);
  }, []);

  // Auto-open "Add Section" modal when arriving from course creation
  useEffect(() => {
    if (autoOpenHandled.current) return;
    if (!routeState?.courseId || loading) return;
    autoOpenHandled.current = true;
    setFormData({ ...EMPTY_FORM, courseId: routeState.courseId });
    setShowModal(true);
  }, [routeState?.courseId, loading]);

  if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') return <Navigate to="/dashboard" replace />;

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/admin/sections');
      setSections(data.sections || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/admin/courses');
      setCourses(data.courses || []);
    } catch { /* silent */ }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  // Suggested sort_order = max existing + 1 for the chosen course
  const suggestedOrder = useMemo(() => {
    if (!formData.courseId) return 1;
    const courseSections = sections.filter((s) => s.course_id === formData.courseId);
    return courseSections.length === 0
      ? 1
      : Math.max(...courseSections.map((s) => s.order_index)) + 1;
  }, [sections, formData.courseId]);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3)
      errors.title = 'عنوان القسم يجب أن يكون 3 أحرف على الأقل';
    if (!formData.courseId)
      errors.courseId = 'يجب اختيار الدورة';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Form submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        courseId: formData.courseId,
        orderIndex: parseInt(formData.orderIndex) || suggestedOrder,
      };

      if (editingSection) {
        await api.put(`/admin/sections/${editingSection.id}`, payload);
      } else {
        await api.post('/admin/sections', payload);
      }
      await fetchSections();
      handleCloseModal();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { messageAr?: string } } })?.response?.data?.messageAr
        ?? 'حدث خطأ أثناء الحفظ.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit / Delete / Close ───────────────────────────────────────────────────

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      courseId: section.course_id,
      orderIndex: String(section.order_index),
    });
    setFormErrors({});
    setServerError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الدروس المرتبطة به.')) return;
    try {
      await api.delete(`/admin/sections/${id}`);
      await fetchSections();
    } catch { /* silent */ }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setServerError(null);
    setSubmitting(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-1">إدارة الأقسام</h1>
            {routeState?.courseTitle && (
              <p className="text-sm text-primary font-medium mt-1">
                ← تم إنشاء دورة "{routeState.courseTitle}" — أضف أقسامها الآن
              </p>
            )}
            <p className="text-muted-foreground text-sm mt-1">إجمالي الأقسام: {sections.length}</p>
          </div>
          <button
            onClick={() => {
              setEditingSection(null);
              setFormData(EMPTY_FORM);
              setFormErrors({});
              setServerError(null);
              setShowModal(true);
            }}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            إضافة قسم جديد
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">لا توجد أقسام بعد</p>
            <p className="text-sm mt-1">ابدأ بإضافة قسم أول لإحدى الدورات.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground">#</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground">العنوان</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground">الدورة</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.map((section) => (
                  <tr key={section.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                        {section.order_index}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{section.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {section.course_title || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(section)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingSection ? 'عدّل البيانات ثم اضغط حفظ' : 'يمكنك إضافة دروس للقسم بعد حفظه'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {serverError && (
              <div className="mx-6 mt-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Course */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  الدورة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => {
                    setFormData({ ...formData, courseId: e.target.value, orderIndex: '' });
                    if (formErrors.courseId) setFormErrors({ ...formErrors, courseId: undefined });
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    formErrors.courseId ? 'border-red-400 bg-red-50' : 'border-border'
                  }`}
                >
                  <option value="">— اختر الدورة —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                {formErrors.courseId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.courseId}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  عنوان القسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                  }}
                  placeholder="مثال: الفصل الأول — المقدمة"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    formErrors.title ? 'border-red-400 bg-red-50' : 'border-border'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  الترتيب
                  {formData.courseId && !editingSection && (
                    <span className="text-xs text-muted-foreground mr-1">
                      (مقترح: {suggestedOrder})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                  placeholder={String(suggestedOrder)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

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
                    <span>{editingSection ? 'حفظ التعديلات' : 'إضافة القسم'}</span>
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
