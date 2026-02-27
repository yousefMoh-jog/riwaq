import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Tag } from 'lucide-react';

export function AdminCouponsPage() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#3B2F82]/10 dark:bg-[#8478C9]/20 rounded-full p-3">
            <Tag className="w-6 h-6 text-[#3B2F82] dark:text-[#8478C9]" />
          </div>
          <div>
            <h1 className="text-3xl text-gray-900 dark:text-white">إدارة الكوبونات</h1>
            <p className="text-gray-500 dark:text-slate-400">قريباً...</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center theme-transition">
          <Tag className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl mb-2 text-gray-900 dark:text-white">قيد التطوير</h2>
          <p className="text-gray-500 dark:text-slate-400">
            سيتم إضافة نظام الكوبونات قريباً
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
