import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

interface RiwaqHeaderProps {
  currentPage?: string;
}

export function RiwaqHeader({ currentPage = 'home' }: RiwaqHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'الرئيسية', to: '/' },
    { id: 'courses', label: 'الدورات', to: '/courses' },
    { id: 'about', label: 'عن رِواق', href: '#about' },
    { id: 'contact', label: 'تواصل معنا', href: '#contact' },
  ];

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-[#0f172a] border-b border-border dark:border-gray-800 sticky top-0 z-50 shadow-sm dark:shadow-gray-900/50 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* give the row enough height so the logo can actually grow */}
        <div className="flex items-center justify-between py-3 sm:py-4 min-h-[96px] sm:min-h-[112px] md:min-h-[128px]">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center group transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-2 py-1 -mx-2 -my-1"
          >
            {/* wrapper controls height (more reliable than img alone) */}
            <div className="flex items-center justify-center h-[90px] sm:h-[110px] md:h-[130px] lg:h-[150px] overflow-visible">
              <img
                src="/riwaq-logo.png"
                alt="رِواق"
                className="h-full w-auto object-contain transition-all duration-200 !max-h-none"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.to ? (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`transition-colors ${currentPage === item.id
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={item.href}
                  className={`transition-colors ${currentPage === item.id
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Admin / Instructor panel shortcut — role-gated */}
                {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                  <Link
                    to={user.role === 'INSTRUCTOR' ? '/admin/courses' : '/admin/dashboard'}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    <LayoutDashboard size={16} />
                    <span>{user.role === 'INSTRUCTOR' ? 'لوحة المدرس' : 'لوحة الإدارة'}</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <User size={18} />
                  <span>الملف الشخصي</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <LogOut size={18} />
                  <span>تسجيل الخروج</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  انضم الآن
                </Link>
              </>
            )}
          </div>

          {/* Theme Toggle — always visible */}
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border dark:border-gray-800 bg-white dark:bg-[#0f172a] theme-transition">
          <nav className="px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) =>
              item.to ? (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`py-2 transition-colors ${currentPage === item.id
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={item.href}
                  className={`py-2 transition-colors ${currentPage === item.id
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              {isAuthenticated ? (
                <>
                  {/* Admin / Instructor shortcut — mobile */}
                  {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                    <Link
                      to={user.role === 'INSTRUCTOR' ? '/admin/courses' : '/admin/dashboard'}
                      className="flex items-center gap-2 justify-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      <span>{user.role === 'INSTRUCTOR' ? 'لوحة المدرس' : 'لوحة الإدارة'}</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 justify-center py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>الملف الشخصي</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 justify-center py-2 text-foreground hover:text-primary transition-colors"
                  >
                    <LogOut size={18} />
                    <span>تسجيل الخروج</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-center py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="text-center bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    انضم الآن
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
