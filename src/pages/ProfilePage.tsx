import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { educationalLevelLabel } from '../lib/utils';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { RiwaqFooter } from '../app/components/RiwaqFooter';

export function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون على الأقل 8 أحرف' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      if (data.ok) {
        setMessage({ type: 'success', text: data.messageAr || 'تم تغيير كلمة المرور بنجاح' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.messageAr || 'حدث خطأ' });
      }
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.messageAr || err.message || 'حدث خطأ في تغيير كلمة المرور'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">يتم التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <RiwaqHeader />
      
      <main className="flex-1 bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-border p-6 md:p-8 mb-8">
            <h1 className="text-2xl md:text-3xl mb-6">الملف الشخصي</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">الاسم الكامل</label>
                <p className="text-lg">{user.fullName || 'غير محدد'}</p>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">البريد الإلكتروني</label>
                <p className="text-lg">{user.email}</p>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">رقم الهاتف</label>
                <p className="text-lg text-right" dir="ltr">{user.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">المستوى التعليمي</label>
                <p className="text-lg">{educationalLevelLabel(user.educationalLevel)}</p>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">تاريخ الانضمام</label>
                <p className="text-lg">
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'غير محدد'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-border p-6 md:p-8">
            <h2 className="text-xl md:text-2xl mb-6">تغيير كلمة المرور</h2>
            
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">كلمة المرور الحالية</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </div>
        </div>
      </main>
      
      <RiwaqFooter />
    </div>
  );
}
