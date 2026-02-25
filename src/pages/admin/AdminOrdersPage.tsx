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
            <div className="bg-primary/10 rounded-full p-3">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl">المشتريات والتسجيلات</h1>
              <p className="text-muted-foreground">إجمالي التسجيلات: {enrollments.length}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 text-right">
            <p className="text-xs text-green-600 mb-0.5">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-green-700">{totalRevenue.toLocaleString('ar-EG')} <span className="text-base font-normal">د.ل</span></p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">جاري التحميل...</div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-border p-16 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground text-lg">لا توجد تسجيلات حتى الآن</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center gap-1.5 justify-end">
                        <User size={14} />
                        <span>اسم الطالب</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center gap-1.5 justify-end">
                        <BookOpen size={14} />
                        <span>عنوان الدورة</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center gap-1.5 justify-end">
                        <DollarSign size={14} />
                        <span>السعر</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar size={14} />
                        <span>تاريخ الشراء</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{enrollment.student_name || 'غير محدد'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {enrollment.student_email || '—'}
                      </td>
                      <td className="px-6 py-4">{enrollment.course_title || 'غير محدد'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-medium text-green-700">
                          {Number(enrollment.price || 0).toLocaleString('ar-EG')}
                          <span className="text-xs text-muted-foreground font-normal">د.ل</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
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
