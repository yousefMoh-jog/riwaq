import logoIconImage from "../../assets/685e9acefe93c65921fc8b2473c19570661820be.png";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src={logoIconImage} alt="رواق" className="h-16 w-auto" />
            <p className="text-sm opacity-90 text-center md:text-right">
              منصة رواق للتعليم الإلكتروني - نحو تعليم أفضل
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-right">
            <h3 className="mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <a href="/" className="hover:text-accent transition-colors">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="/courses" className="hover:text-accent transition-colors">
                  الدورات
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-accent transition-colors">
                  تسجيل الدخول
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-right">
            <h3 className="mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm opacity-90">
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-4 h-4" />
                <span>info@rewaq.edu</span>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="w-4 h-4" />
                <span>+966 12 345 6789</span>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <MapPin className="w-4 h-4" />
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-75">
          <p>© 2026 رواق. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
