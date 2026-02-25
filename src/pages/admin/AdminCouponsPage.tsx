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
          <div className="bg-primary/10 rounded-full p-3">
            <Tag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl">إدارة الكوبونات</h1>
            <p className="text-muted-foreground">قريباً...</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-border p-12 text-center">
          <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl mb-2">قيد التطوير</h2>
          <p className="text-muted-foreground">
            سيتم إضافة نظام الكوبونات قريباً
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
