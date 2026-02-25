import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  List,
  Video,
  ShoppingCart,
  Tag,
  Menu,
  X,
  LogOut,
  Home,
  GraduationCap,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const ADMIN_NAV = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, to: '/admin/dashboard' },
  { id: 'users',     label: 'المستخدمين',  icon: Users,           to: '/admin/users' },
  { id: 'courses',   label: 'الدورات',      icon: BookOpen,        to: '/admin/courses' },
  { id: 'sections',  label: 'الأقسام',      icon: List,            to: '/admin/sections' },
  { id: 'lessons',   label: 'الدروس',       icon: Video,           to: '/admin/lessons' },
  { id: 'orders',    label: 'المشتريات',    icon: ShoppingCart,    to: '/admin/orders' },
  { id: 'coupons',   label: 'الكوبونات',    icon: Tag,             to: '/admin/coupons' },
];

const INSTRUCTOR_NAV = [
  { id: 'courses',   label: 'دوراتي',   icon: BookOpen, to: '/admin/courses' },
  { id: 'sections',  label: 'الأقسام',  icon: List,     to: '/admin/sections' },
  { id: 'lessons',   label: 'الدروس',   icon: Video,    to: '/admin/lessons' },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:      'مدير النظام',
  INSTRUCTOR: 'مدرس',
  STUDENT:    'طالب',
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isInstructor = user?.role === 'INSTRUCTOR';
  const navItems = isInstructor ? INSTRUCTOR_NAV : ADMIN_NAV;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-l border-border transition-all duration-300 flex flex-col fixed right-0 top-0 h-screen z-50`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <GraduationCap size={22} className="text-primary" />
              <h2 className="text-xl font-bold text-primary">
                {isInstructor ? 'لوحة المدرس' : 'لوحة الإدارة'}
              </h2>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.id);
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Home size={20} />
            {sidebarOpen && <span>الصفحة الرئيسية</span>}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
          {sidebarOpen && user && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              <div className="truncate">{user.fullName || user.email}</div>
              <div className="truncate text-xs">{ROLE_LABELS[user.role] ?? user.role}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 ${
          sidebarOpen ? 'mr-64' : 'mr-20'
        } transition-all duration-300 min-h-screen`}
      >
        {children}
      </main>
    </div>
  );
}
