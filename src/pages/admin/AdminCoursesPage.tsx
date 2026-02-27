import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { educationalLevelLabel } from '../../lib/utils';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  educational_level: string;
  category_id: string | null;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name_ar: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  educationalLevel: 'preparatory' | 'secondary' | 'university';
  categoryId: string;
  thumbnailUrl: string;
  published: boolean;
}

interface FormErrors {
  title?: string;
  price?: string;
  categoryId?: string;
  thumbnail?: string;
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  price: '',
  educationalLevel: 'secondary',
  categoryId: '',
  thumbnailUrl: '',
  published: true,
};

export function AdminCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/admin/courses');
      setCourses(data.courses || []);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.categories || []);
    } catch {
      // handled silently
    }
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errors.title = 'عنوان الدورة يجب أن يكون 3 أحرف على الأقل';
    }
    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum) || priceNum < 0) {
      errors.price = 'يرجى إدخال سعر صحيح (صفر أو أكثر)';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'يجب اختيار التصنيف';
    }
    if (thumbnailFile) {
      if (!thumbnailFile.type.startsWith('image/')) {
        errors.thumbnail = 'يجب أن يكون الملف صورة';
      } else if (thumbnailFile.size > 5 * 1024 * 1024) {
        errors.thumbnail = 'حجم الصورة يجب أن يكون أقل من 5 ميغابايت';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setThumbnailFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
  };

  const handleRemoveThumbnail = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setThumbnailFile(null);
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      let thumbnailUrl = formData.thumbnailUrl;
      if (thumbnailFile) {
        const fd = new FormData();
        fd.append('thumbnail', thumbnailFile);
        const { data: uploadData } = await api.post(
          '/admin/courses/upload-thumbnail',
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        thumbnailUrl = uploadData.url;
      }
      const payload = { ...formData, thumbnailUrl };
      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse.id}`, payload);
        await fetchCourses();
        handleCloseModal();
      } else {
        const { data } = await api.post('/admin/courses', payload);
        await fetchCourses();
        handleCloseModal();
        navigate('/admin/sections', { state: { courseId: data.course?.id, courseTitle: data.course?.title_ar } });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { messageAr?: string } } })?.response?.data?.messageAr
        ?? 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      educationalLevel: (course.educational_level as FormData['educationalLevel']) ?? 'secondary',
      categoryId: course.category_id ?? '',
      thumbnailUrl: course.thumbnail_url ?? '',
      published: course.published ?? true,
    });
    setPreviewUrl(course.thumbnail_url ?? null);
    setThumbnailFile(null);
    setFormErrors({});
    setServerError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      await fetchCourses();
    } catch {
      // handled silently
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setServerError(null);
    setSubmitting(false);
    setThumbnailFile(null);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setServerError(null);
    setThumbnailFile(null);
    setPreviewUrl(null);
    setShowModal(true);
  };

  /* ── Shared input/select classes ────────────────────────────────────────── */
  const inputBase = 'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B2F82]/30 dark:focus:ring-[#8478C9]/30 transition-shadow bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400';
  const inputNormal = `${inputBase} border-gray-200 dark:border-slate-600`;
  const inputError  = `${inputBase} border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20`;

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-1 text-gray-900 dark:text-white">إدارة الدورات</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">إجمالي الدورات: {courses.length}</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-[#3B2F82] dark:bg-[#8478C9] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            <span>إضافة دورة جديدة</span>
          </button>
        </div>

        {/* Courses Table */}
        {loading ? (
          <div className="text-center text-gray-400 dark:text-slate-500 py-20">جاري التحميل...</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-slate-500 py-20 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد دورات بعد. ابدأ بإضافة دورتك الأولى.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden theme-transition">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300 w-16">الصورة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300 hidden md:table-cell">الوصف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">السعر</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">المستوى</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-12 h-9 object-cover rounded-md border border-gray-200 dark:border-slate-600"
                        />
                      ) : (
                        <div className="w-12 h-9 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                          <ImageIcon size={14} className="text-gray-400 dark:text-slate-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-sm text-gray-900 dark:text-white">{course.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate hidden md:table-cell">
                      {course.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{course.price} د.ل</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                        {educationalLevelLabel(course.educational_level)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {course.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                          <Eye size={11} /> منشور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">
                          <EyeOff size={11} /> مسودة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto theme-transition">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingCourse ? 'تعديل بيانات الدورة' : 'إضافة دورة جديدة'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  {editingCourse ? 'عدّل البيانات ثم اضغط حفظ' : 'أدخل بيانات الدورة الجديدة'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Server Error Banner */}
            {serverError && (
              <div className="mx-6 mt-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">صورة الغلاف</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                    formErrors.thumbnail
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-[#3B2F82]/50 dark:hover:border-[#8478C9]/50 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative group">
                      <img src={previewUrl} alt="معاينة الغلاف" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <span className="text-white text-sm font-medium flex items-center gap-1.5">
                          <Upload size={16} /> تغيير الصورة
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveThumbnail(); }}
                        className="absolute top-2 left-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        title="حذف الصورة"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400 dark:text-slate-400">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                        <ImageIcon size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">اضغط لرفع صورة الغلاف</p>
                        <p className="text-xs mt-1">PNG, JPG, WEBP — بحد أقصى 5 ميغابايت</p>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {formErrors.thumbnail && <p className="text-red-500 text-xs mt-1">{formErrors.thumbnail}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  عنوان الدورة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (formErrors.title) setFormErrors({ ...formErrors, title: undefined }); }}
                  placeholder="مثال: دورة الرياضيات للثانوية العامة"
                  className={formErrors.title ? inputError : inputNormal}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">وصف الدورة</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="اكتب وصفاً مختصراً يشرح محتوى الدورة وأهدافها..."
                  className={`${inputNormal} resize-none`}
                />
              </div>

              {/* Price + Educational Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                    السعر (د.ل) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={formData.price}
                    onChange={(e) => { setFormData({ ...formData, price: e.target.value }); if (formErrors.price) setFormErrors({ ...formErrors, price: undefined }); }}
                    placeholder="0.00"
                    className={formErrors.price ? inputError : inputNormal}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">المستوى التعليمي</label>
                  <select
                    value={formData.educationalLevel}
                    onChange={(e) => setFormData({ ...formData, educationalLevel: e.target.value as FormData['educationalLevel'] })}
                    className={inputNormal}
                  >
                    <option value="preparatory">إعدادي</option>
                    <option value="secondary">ثانوي</option>
                    <option value="university">جامعي</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-200">
                  التصنيف <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => { setFormData({ ...formData, categoryId: e.target.value }); if (formErrors.categoryId) setFormErrors({ ...formErrors, categoryId: undefined }); }}
                  className={formErrors.categoryId ? inputError : inputNormal}
                >
                  <option value="">— اختر التصنيف —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                  ))}
                </select>
                {formErrors.categoryId && <p className="text-red-500 text-xs mt-1">{formErrors.categoryId}</p>}
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-200 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">نشر الدورة</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {formData.published
                      ? 'الدورة ظاهرة للطلاب في المنصة'
                      : 'الدورة مخفية — سيتم حفظها كمسودة'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.published}
                  onClick={() => setFormData({ ...formData, published: !formData.published })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    formData.published
                      ? 'bg-[#3B2F82] dark:bg-[#8478C9]'
                      : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
                  className="px-6 py-2.5 bg-[#3B2F82] dark:bg-[#8478C9] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingCourse ? 'حفظ التعديلات' : 'إضافة الدورة'}</span>
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
