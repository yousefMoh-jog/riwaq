import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { CheckCircle, BookOpen, Home, ArrowLeft } from 'lucide-react';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') ?? '';
  const courseName = searchParams.get('courseName') ?? 'الدورة';

  // Animate the checkmark in on mount
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <RiwaqHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">

          {/* Animated checkmark */}
          <div
            className={`transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
          >
            <div className="relative inline-flex">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-green-100 border-4 border-green-400 flex items-center justify-center shadow-lg">
                <CheckCircle size={48} className="text-green-500" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Message */}
          <div
            className={`space-y-2 transition-all duration-500 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-green-700">
              تمت عملية الشراء بنجاح! 🎉
            </h1>
            <p className="text-muted-foreground">
              تم تفعيل اشتراكك في
            </p>
            <p className="font-semibold text-foreground text-lg bg-green-50 border border-green-200 px-4 py-2 rounded-xl inline-block">
              {decodeURIComponent(courseName)}
            </p>
          </div>

          {/* Receipt card */}
          <div
            className={`bg-white rounded-2xl border border-border shadow-sm p-5 text-right space-y-3 text-sm transition-all duration-500 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <p className="font-semibold text-foreground mb-2">تفاصيل العملية</p>
            <div className="flex justify-between text-muted-foreground border-b border-dashed pb-2">
              <span>{new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>التاريخ</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-b border-dashed pb-2">
              <span className="text-green-600 font-medium">مدفوع</span>
              <span>الحالة</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>بطاقة ائتمانية (تجريبي)</span>
              <span>طريقة الدفع</span>
            </div>
          </div>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-500 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {courseId && (
              <Link
                to={`/course-viewer/${courseId}`}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <BookOpen size={18} />
                ابدأ التعلم الآن
              </Link>
            )}
            <Link
              to="/courses"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-border text-foreground rounded-xl font-medium hover:bg-muted/30 transition-colors"
            >
              <ArrowLeft size={16} />
              تصفح المزيد من الدورات
            </Link>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <Home size={14} />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </main>
    </div>
  );
}
