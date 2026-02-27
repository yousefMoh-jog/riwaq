import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function RiwaqFooter() {
  return (
    <footer className="bg-[#3B2F82] dark:bg-slate-900 dark:border-t dark:border-slate-800 text-white mt-auto theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="flex flex-col gap-4">
            <img src="/riwaq-logo.png" alt="رِواق" className="h-10 w-auto brightness-0 invert" />
            <p className="text-white/70 dark:text-slate-400 leading-relaxed">
              منصة تعليمية متخصصة في تقديم دورات فيديو احترافية لتطوير مهاراتك ومعارفك
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg">روابط سريعة</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-white transition-colors">
                الرئيسية
              </Link>
              <Link to="/courses" className="text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-white transition-colors">
                الدورات
              </Link>
              <a href="#about" className="text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-white transition-colors">
                عن رِواق
              </a>
              <a href="#privacy" className="text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-white transition-colors">
                سياسة الخصوصية
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg">تواصل معنا</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="flex-shrink-0" />
                <span className="text-white/70 dark:text-slate-400">info@rawaq.ly</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="flex-shrink-0" />
                <span className="text-white/70 dark:text-slate-400">+218 91 234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="flex-shrink-0" />
                <span className="text-white/70 dark:text-slate-400">طرابلس، ليبيا</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/20 dark:border-slate-700/60 text-center">
          <p className="text-white/60 dark:text-slate-500">
            © 2026 رِواق. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}
