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

  // Thumbnail file state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  // Clean up object URL when preview changes or modal closes
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

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── Thumbnail file selection ──────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      let thumbnailUrl = formData.thumbnailUrl;

      // Upload new image file first if one was selected
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
        // Redirect to sections management for the new course
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

  // ── Edit / Delete / Close ─────────────────────────────────────────────────
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

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-1">إدارة الدورات</h1>
            <p className="text-muted-foreground text-sm">إجمالي الدورات: {courses.length}</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            <span>إضافة دورة جديدة</span>
          </button>
        </div>

        {/* Courses Table */}
        {loading ? (
          <div className="text-center text-muted-foreground py-20">جاري التحميل...</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 border border-dashed border-border rounded-lg">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد دورات بعد. ابدأ بإضافة دورتك الأولى.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold w-16">الصورة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold hidden md:table-cell">الوصف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">السعر</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">المستوى</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-12 h-9 object-cover rounded-md border border-border"
                        />
                      ) : (
                        <div className="w-12 h-9 bg-muted rounded-md flex items-center justify-center">
                          <ImageIcon size={14} className="text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{course.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate hidden md:table-cell">
                      {course.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{course.price} د.ل</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {educationalLevelLabel(course.educational_level)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {course.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Eye size={11} /> منشور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <EyeOff size={11} /> مسودة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingCourse ? 'تعديل بيانات الدورة' : 'إضافة دورة جديدة'}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editingCourse ? 'عدّل البيانات ثم اضغط حفظ' : 'أدخل بيانات الدورة الجديدة'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Server Error Banner */}
            {serverError && (
              <div className="mx-6 mt-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">صورة الغلاف</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                    formErrors.thumbnail
                      ? 'border-red-400 bg-red-50'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="معاينة الغلاف"
                        className="w-full h-48 object-cover"
                      />
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
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center">
                        <ImageIcon size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">اضغط لرفع صورة الغلاف</p>
                        <p className="text-xs mt-1">PNG, JPG, WEBP — بحد أقصى 5 ميغابايت</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {formErrors.thumbnail && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.thumbnail}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  عنوان الدورة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                  }}
                  placeholder="مثال: دورة الرياضيات للثانوية العامة"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${
                    formErrors.title ? 'border-red-400 bg-red-50' : 'border-border'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">وصف الدورة</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="اكتب وصفاً مختصراً يشرح محتوى الدورة وأهدافها..."
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
                />
              </div>

              {/* Price + Educational Level (side by side) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    السعر (د.ل) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (formErrors.price) setFormErrors({ ...formErrors, price: undefined });
                    }}
                    placeholder="0.00"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${
                      formErrors.price ? 'border-red-400 bg-red-50' : 'border-border'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">المستوى التعليمي</label>
                  <select
                    value={formData.educationalLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        educationalLevel: e.target.value as FormData['educationalLevel'],
                      })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow bg-white"
                  >
                    <option value="preparatory">إعدادي</option>
                    <option value="secondary">ثانوي</option>
                    <option value="university">جامعي</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  التصنيف <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value });
                    if (formErrors.categoryId) setFormErrors({ ...formErrors, categoryId: undefined });
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow bg-white ${
                    formErrors.categoryId ? 'border-red-400 bg-red-50' : 'border-border'
                  }`}
                >
                  <option value="">— اختر التصنيف —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_ar}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.categoryId}</p>
                )}
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                <div>
                  <p className="text-sm font-medium">نشر الدورة</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                    formData.published ? 'bg-primary' : 'bg-muted-foreground/30'
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
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
