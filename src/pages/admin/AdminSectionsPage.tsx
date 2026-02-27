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

  useEffect(() => {
    if (autoOpenHandled.current) return;
    if (!routeState?.courseId || loading) return;
    autoOpenHandled.current = true;
    setFormData({ ...EMPTY_FORM, courseId: routeState.courseId });
    setShowModal(true);
  }, [routeState?.courseId, loading]);

  if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') return <Navigate to="/dashboard" replace />;

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

  const suggestedOrder = useMemo(() => {
    if (!formData.courseId) return 1;
    const courseSections = sections.filter((s) => s.course_id === formData.courseId);
    return courseSections.length === 0
      ? 1
      : Math.max(...courseSections.map((s) => s.order_index)) + 1;
  }, [sections, formData.courseId]);

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3)
      errors.title = 'عنوان القسم يجب أن يكون 3 أحرف على الأقل';
    if (!formData.courseId)
      errors.courseId = 'يجب اختيار الدورة';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({ title: section.title, courseId: section.course_id, orderIndex: String(section.order_index) });
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

  const inputBase = 'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B2F82]/30 dark:focus:ring-[#8478C9]/30 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400';
  const inputNormal = `${inputBase} border-gray-200 dark:border-slate-600`;
  const inputError  = `${inputBase} border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20`;

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-1 text-gray-900 dark:text-white">إدارة الأقسام</h1>
            {routeState?.courseTitle && (
              <p className="text-sm text-[#3B2F82] dark:text-[#8478C9] font-medium mt-1">
                ← تم إنشاء دورة "{routeState.courseTitle}" — أضف أقسامها الآن
              </p>
            )}
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">إجمالي الأقسام: {sections.length}</p>
          </div>
          <button
            onClick={() => {
              setEditingSection(null);
              setFormData(EMPTY_FORM);
              setFormErrors({});
              setServerError(null);
              setShowModal(true);
            }}
            className="bg-[#3B2F82] dark:bg-[#8478C9] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            إضافة قسم جديد
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-slate-500 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 dark:text-slate-500">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">لا توجد أقسام بعد</p>
            <p className="text-sm mt-1">ابدأ بإضافة قسم أول لإحدى الدورات.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden theme-transition">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">#</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">العنوان</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">الدورة</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {sections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-mono bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {section.order_index}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{section.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {section.course_title || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(section)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md theme-transition">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {editingSection ? 'عدّل البيانات ثم اضغط حفظ' : 'يمكنك إضافة دروس للقسم بعد حفظه'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 dark:text-slate-400"
              >
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
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  الدورة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => { setFormData({ ...formData, courseId: e.target.value, orderIndex: '' }); if (formErrors.courseId) setFormErrors({ ...formErrors, courseId: undefined }); }}
                  className={formErrors.courseId ? inputError : inputNormal}
                >
                  <option value="">— اختر الدورة —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                {formErrors.courseId && <p className="text-red-500 text-xs mt-1">{formErrors.courseId}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  عنوان القسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (formErrors.title) setFormErrors({ ...formErrors, title: undefined }); }}
                  placeholder="مثال: الفصل الأول — المقدمة"
                  className={formErrors.title ? inputError : inputNormal}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  الترتيب
                  {formData.courseId && !editingSection && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 mr-1">
                      (مقترح: {suggestedOrder})
                    </span>
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
