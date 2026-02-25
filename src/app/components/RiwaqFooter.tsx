import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function RiwaqFooter() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="flex flex-col gap-4">
            <img src="/riwaq-logo.png" alt="رِواق" className="h-10 w-auto brightness-0 invert" />
            <p className="text-primary-foreground/80 leading-relaxed">
              منصة تعليمية متخصصة في تقديم دورات فيديو احترافية لتطوير مهاراتك ومعارفك
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg">روابط سريعة</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                الرئيسية
              </Link>
              <Link to="/courses" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                الدورات
              </Link>
              <a href="#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                عن رِواق
              </a>
              <a href="#privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
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
                <span className="text-primary-foreground/80">info@rawaq.ly</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="flex-shrink-0" />
                <span className="text-primary-foreground/80">+218 91 234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="flex-shrink-0" />
                <span className="text-primary-foreground/80">طرابلس، ليبيا</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/70">
            © 2026 رِواق. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}
