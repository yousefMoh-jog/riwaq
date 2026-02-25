import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { educationalLevelLabel } from '../lib/utils';
import { AdminLayout } from '../layouts/AdminLayout';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  educational_level: string;
  role: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'STUDENT',    label: 'طالب' },
  { value: 'INSTRUCTOR', label: 'مدرس' },
  { value: 'ADMIN',      label: 'مدير' },
];

const roleBadgeClass = (role: string) => {
  switch (role) {
    case 'ADMIN':      return 'bg-purple-100 text-purple-800';
    case 'INSTRUCTOR': return 'bg-blue-100 text-blue-800';
    default:           return 'bg-gray-100 text-gray-800';
  }
};

const roleLabel = (role: string) => {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
};

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/users');
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.response?.data?.messageAr || 'حدث خطأ في تحميل المستخدمين');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setSuccessId(null);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccessId(userId);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.messageAr || 'فشل تحديث الدور');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 rounded-full p-3">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">عدد المستخدمين: {users.length}</p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-border p-8 text-center">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium">الاسم</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">المستوى التعليمي</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">تغيير الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{u.full_name || 'غير محدد'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          {educationalLevelLabel(u.educational_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${roleBadgeClass(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={updatingId === u.id || u.id === user?.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-sm border border-border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {successId === u.id && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {u.id === user?.id && (
                            <span className="text-xs text-muted-foreground">(أنت)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('ar-EG', {
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
