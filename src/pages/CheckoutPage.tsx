import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { Lock, CreditCard, ArrowLeft, CheckCircle, Shield } from 'lucide-react';

interface CourseInfo {
  id: string;
  title: string;
  price: string;
  educational_level: string;
  thumbnail_url?: string;
}

// ── Card number formatter ────────────────────────────────────────────────────
function fmtCard(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
function maskCard(formatted: string) {
  if (!formatted) return '•••• •••• •••• ••••';
  const digits = formatted.replace(/\s/g, '');
  const visible = digits.slice(-4).padStart(4, '•');
  return `•••• •••• •••• ${visible}`;
}

export function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment state
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');
  const [serverError, setServerError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated]);

  // Load course
  useEffect(() => {
    if (!courseId) return;
    api.get(`/courses/${courseId}`)
      .then(({ data }) => setCourse(data))
      .catch(() => setCourse(null))
      .finally(() => setLoadingCourse(false));
  }, [courseId]);

  // ── Validation ──────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 16) e.cardNumber = 'رقم البطاقة يجب أن يكون 16 رقماً';
    if (!cardName.trim() || cardName.trim().length < 3) e.cardName = 'الرجاء إدخال اسم حامل البطاقة';
    if (expiry.length < 5) e.expiry = 'الرجاء إدخال تاريخ الانتهاء (MM/YY)';
    if (pin.length < 4) e.pin = 'الرقم السري يجب أن يكون 4 أرقام على الأقل';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate() || !courseId) return;

    setStage('processing');
    await new Promise((r) => setTimeout(r, 1800));

    try {
      await api.post('/payments/confirm', { courseId });
      setStage('done');
      setTimeout(() => {
        navigate(`/course/${courseId}`, { replace: true });
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الدفع';
      setServerError(msg);
      setStage('form');
    }
  };

  // ── Price helpers ────────────────────────────────────────────────────────

  const priceNum = parseFloat(String(course?.price ?? '0'));
  const isFree = !isNaN(priceNum) && priceNum === 0;

  // ── Loading/error states ─────────────────────────────────────────────────

  if (loadingCourse) {
    return (
      <div className="min-h-screen flex flex-col">
        <RiwaqHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <RiwaqHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-lg">الدورة غير موجودة</p>
            <Link to="/courses" className="text-primary hover:underline text-sm">العودة للدورات</Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <RiwaqHeader />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Back link */}
          <Link
            to={`/course/${courseId}`}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            العودة لتفاصيل الدورة
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Left: Payment form ──────────────────────────────────── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-white/80" />
                  <h1 className="text-white font-semibold">إتمام الدفع</h1>
                  <div className="mr-auto flex items-center gap-1.5 text-white/60 text-xs">
                    <Lock size={12} />
                    <span>اتصال آمن</span>
                  </div>
                </div>

                {/* Credit Card Visual */}
                <div className="px-6 pt-6">
                  <div className="relative h-44 rounded-2xl overflow-hidden shadow-lg select-none"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #1d4ed8 100%)' }}>
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute top-8 -right-4 w-24 h-24 rounded-full bg-white/5" />

                    <div className="relative h-full flex flex-col justify-between p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <div className="w-8 h-5 rounded bg-yellow-400/90" />
                          <div className="w-8 h-5 rounded bg-yellow-500/60 -mr-4" />
                        </div>
                        <span className="text-white/70 text-sm font-semibold tracking-wider">VISA</span>
                      </div>

                      <div>
                        <p className="text-white font-mono text-lg tracking-widest mb-1">
                          {maskCard(cardNumber)}
                        </p>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-white/50 text-xs uppercase mb-0.5">حامل البطاقة</p>
                            <p className="text-white text-sm font-medium truncate max-w-[140px]">
                              {cardName.toUpperCase() || 'FULL NAME'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/50 text-xs mb-0.5">تاريخ الانتهاء</p>
                            <p className="text-white text-sm font-mono">{expiry || 'MM/YY'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handlePay} className="px-6 pb-6 pt-5 space-y-4">

                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      رقم البطاقة
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                      disabled={stage !== 'form'}
                      className="w-full px-4 py-3 border border-input rounded-xl font-mono tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-muted disabled:cursor-not-allowed"
                    />
                    {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      اسم حامل البطاقة
                    </label>
                    <input
                      type="text"
                      placeholder="AHMED ALI"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={stage !== 'form'}
                      className="w-full px-4 py-3 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-muted disabled:cursor-not-allowed"
                    />
                    {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                  </div>

                  {/* Expiry + PIN */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        تاريخ الانتهاء
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                        disabled={stage !== 'form'}
                        className="w-full px-4 py-3 border border-input rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-muted disabled:cursor-not-allowed"
                      />
                      {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        الرقم السري (PIN)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="••••"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={stage !== 'form'}
                        className="w-full px-4 py-3 border border-input rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-muted disabled:cursor-not-allowed"
                      />
                      {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
                    </div>
                  </div>

                  {/* Server Error */}
                  {serverError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                      {serverError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={stage !== 'form'}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {stage === 'processing' ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري معالجة الدفع...</span>
                      </>
                    ) : stage === 'done' ? (
                      <>
                        <CheckCircle size={20} className="text-green-300" />
                        <span>تمت العملية! جارٍ التحويل للدورة...</span>
                        <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin mr-1" />
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        <span>
                          {isFree ? 'التحق مجاناً' : `ادفع ${course.price} د.ل الآن`}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Security note */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Shield size={13} />
                    <span>هذا نظام دفع تجريبي — لا يتم تحصيل أي مبالغ حقيقية</span>
                  </div>
                </form>
              </div>
            </div>

            {/* ── Right: Order Summary ─────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden sticky top-24">

                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">ملخص الطلب</h2>
                </div>

                {/* Course thumbnail */}
                {course.thumbnail_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="px-5 py-4 space-y-4">
                  <p className="font-medium text-foreground leading-snug">{course.title}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>سعر الدورة</span>
                      <span>{isFree ? 'مجاني' : `${course.price} د.ل`}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>رسوم المعالجة</span>
                      <span>0.00 د.ل</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>الإجمالي</span>
                    <span className="text-primary text-lg">
                      {isFree ? 'مجاني' : `${course.price} د.ل`}
                    </span>
                  </div>

                  {/* Trust badges */}
                  <div className="pt-2 space-y-2">
                    {[
                      'وصول مدى الحياة للمحتوى',
                      'ضمان استرداد خلال 30 يوم',
                      'شهادة إتمام معتمدة',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
