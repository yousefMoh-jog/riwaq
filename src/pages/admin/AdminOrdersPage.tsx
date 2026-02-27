import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminLayout } from '../../layouts/AdminLayout';
import { ShoppingCart, User, BookOpen, DollarSign, Calendar } from 'lucide-react';

interface Enrollment {
  id: string;
  student_name: string | null;
  student_email: string | null;
  course_title: string | null;
  price: number;
  purchase_date: string;
}

export function AdminOrdersPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    fetchEnrollments();
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchEnrollments = async () => {
    try {
      const { data } = await api.get('/admin/orders');
      setEnrollments(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = enrollments.reduce((sum, e) => sum + (Number(e.price) || 0), 0);

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#3B2F82]/10 dark:bg-[#8478C9]/20 rounded-full p-3">
              <ShoppingCart className="w-6 h-6 text-[#3B2F82] dark:text-[#8478C9]" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-900 dark:text-white">المشتريات والتسجيلات</h1>
              <p className="text-gray-500 dark:text-slate-400">إجمالي التسجيلات: {enrollments.length}</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg px-5 py-3 text-right">
            <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {totalRevenue.toLocaleString('ar-EG')} <span className="text-base font-normal">د.ل</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 dark:text-slate-500 py-16">جاري التحميل...</div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-16 text-center theme-transition">
            <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 dark:text-slate-500 text-lg">لا توجد تسجيلات حتى الآن</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden theme-transition">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 justify-end">
                        <User size={14} />
                        <span>اسم الطالب</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-slate-300">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 justify-end">
                        <BookOpen size={14} />
                        <span>عنوان الدورة</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 justify-end">
                        <DollarSign size={14} />
                        <span>السعر</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar size={14} />
                        <span>تاريخ الشراء</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{enrollment.student_name || 'غير محدد'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {enrollment.student_email || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-slate-300">{enrollment.course_title || 'غير محدد'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-medium text-green-700 dark:text-green-400">
                          {Number(enrollment.price || 0).toLocaleString('ar-EG')}
                          <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">د.ل</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {new Date(enrollment.purchase_date).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
