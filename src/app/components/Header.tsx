import { Link } from "./Link";
import logoImage from "../../assets/72d8a70905e642af37def420be897f396f1a23fd.png";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-3.5 md:py-4">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={18} />
                  <span>{user?.fullName || user?.email || 'مستخدم'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <LogOut size={18} />
                  <span>تسجيل الخروج</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="text-foreground hover:text-primary transition-colors">
                تسجيل الدخول
              </Link>
            )}
            <Link href="/courses" className="text-foreground hover:text-primary transition-colors">
              الدورات
            </Link>
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              الرئيسية
            </Link>
          </nav>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center group transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-2 py-1 -mx-2 -my-1"
          >
            <img
              src={logoImage}
              alt="رواق"
              className="h-12 sm:h-14 md:h-16 w-auto transition-all duration-200"
            />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-foreground hover:text-primary transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <Link
                href="/courses"
                className="text-foreground hover:text-primary transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الدورات
              </Link>
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
                    <User size={18} />
                    <span>{user?.fullName || user?.email || 'مستخدم'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors px-4 py-2 text-right"
                  >
                    <LogOut size={18} />
                    <span>تسجيل الخروج</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-foreground hover:text-primary transition-colors px-4 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
