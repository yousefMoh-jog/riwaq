import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MobileNavButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const isAdmin      = user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';

  const pages = [
    { to: '/',        label: 'الرئيسية' },
    { to: '/courses', label: 'الدورات' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'لوحتي' }] : []),
    ...(isAdmin      ? [{ to: '/admin/dashboard', label: 'لوحة الإدارة' }] : []),
    ...(isInstructor ? [{ to: '/admin/courses',   label: 'لوحة المدرس'  }] : []),
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="قائمة التنقل السريع"
        className="fixed bottom-4 left-4 lg:hidden z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-20 left-4 bg-white border border-border rounded-xl shadow-xl p-4 z-50 lg:hidden min-w-[160px]">
            <div className="text-xs text-muted-foreground mb-3 font-medium">التنقل السريع</div>
            <div className="flex flex-col gap-1">
              {pages.map((page) => (
                <Link
                  key={page.to}
                  to={page.to}
                  onClick={() => setIsOpen(false)}
                  className="text-foreground hover:text-primary hover:bg-muted rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
