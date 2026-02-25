import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/797dee12d8a0f858d28bcc842920673bbdf0baf2.png';
import { Phone } from 'lucide-react';
import { authService, getApiErrorMessage } from '../../lib/auth.service';
import { validateLibyaPhone, formatLibyaPhoneDisplay } from '../../lib/phone';
import { useAuth } from '../../context/AuthContext';

const RESEND_COOLDOWN_SEC = 60;
const OTP_LENGTH = 4;

export function RiwaqAuthPage() {
  const { loginWithOtp, clearError, error: authError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('secondary');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const submitLock = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneRef = useRef('');
  const fullNameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const educationalLevelRef = useRef('secondary');

  phoneRef.current = phone;
  fullNameRef.current = fullName;
  emailRef.current = email;
  passwordRef.current = password;
  educationalLevelRef.current = educationalLevel;

  const validation = validateLibyaPhone(phone.trim());
  const fullNameValid = fullName.trim().length >= 2;
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const displayPhone = phoneE164 ? formatLibyaPhoneDisplay(phoneE164) : '';
  const canSubmitRequest = (mode === 'login' || fullNameValid) && emailValid && passwordValid && validation.ok && !!validation.e164;

  const clearLocalError = useCallback(() => {
    setError(null);
    clearError();
  }, [clearError]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    const id = setInterval(() => {
      setResendCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    countdownRef.current = id;
    return () => clearInterval(id);
  }, [resendCountdown]);

  const handleRequestOtpSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clearLocalError();
      if (submitLock.current) return;

      const nameToUse = mode === 'login' ? '' : (fullNameRef.current ?? '').trim();
      const emailToUse = (emailRef.current ?? '').trim();
      const passwordToUse = passwordRef.current ?? '';
      const phoneToUse = (phoneRef.current ?? '').trim();

      if (mode === 'register' && nameToUse.length < 2) {
        setError('الاسم الكامل يجب أن يكون حرفين على الأقل');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailToUse)) {
        setError('البريد الإلكتروني غير صالح');
        return;
      }
      if (!passwordToUse || passwordToUse.length < 8) {
        setError('كلمة المرور يجب أن تكون على الأقل 8 أحرف');
        return;
      }
      const v = validateLibyaPhone(phoneToUse);
      if (!v.ok || !v.e164) {
        setError(v.messageAr ?? 'رقم الهاتف غير صالح');
        return;
      }

      submitLock.current = true;
      setLoading(true);
      try {
        const res = await authService.requestOtp(nameToUse, emailToUse, passwordToUse, phoneToUse, mode === 'login' ? 'secondary' : educationalLevelRef.current);
        if (!res.ok) {
          setError(res.messageAr);
          return;
        }
        setPhoneE164(v.e164);
        setStep('otp');
        setCode('');
        setResendCountdown(RESEND_COOLDOWN_SEC);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
        submitLock.current = false;
      }
    },
    [mode, clearLocalError]
  );

  const handleResendOtp = useCallback(async () => {
    if (resendCountdown > 0 || !phoneE164 || submitLock.current) return;
    const nameToUse = mode === 'login' ? '' : (fullNameRef.current ?? '').trim();
    const emailToUse = (emailRef.current ?? '').trim();
    const passwordToUse = passwordRef.current ?? '';
    if ((mode === 'register' && nameToUse.length < 2) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailToUse) || !passwordToUse || passwordToUse.length < 8) return;
    clearLocalError();
    submitLock.current = true;
    setLoading(true);
    try {
      const res = await authService.requestOtp(nameToUse, emailToUse, passwordToUse, phoneRef.current ?? '', mode === 'login' ? 'secondary' : educationalLevelRef.current);
      if (res.ok) {
        setResendCountdown(RESEND_COOLDOWN_SEC);
      } else {
        setError(res.messageAr);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      submitLock.current = false;
    }
  }, [mode, phoneE164, resendCountdown, clearLocalError]);

  const handleVerifyOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearLocalError();
      if (submitLock.current || !phoneE164) return;

      const pin = code.replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (pin.length < OTP_LENGTH) {
        setError(`أدخل رمز التحقق (${OTP_LENGTH} أرقام)`);
        return;
      }

      const emailToUse = (emailRef.current ?? '').trim();
      if (!emailToUse) {
        setError('البريد الإلكتروني مطلوب');
        return;
      }

      submitLock.current = true;
      setLoading(true);
      try {
        await loginWithOtp(phoneE164, emailToUse, pin);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
        submitLock.current = false;
      }
    },
    [phoneE164, code, loginWithOtp, clearLocalError]
  );

  const goBackToForm = useCallback(() => {
    setStep('form');
    setCode('');
    setResendCountdown(0);
    setPhoneE164(null);
    clearLocalError();
  }, [clearLocalError]);

  const displayError = error ?? authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logo} alt="رِواق" className="h-16 mx-auto" />
          </Link>
          <p className="text-primary-foreground/80 mt-4">
            {step === 'otp' ? 'أدخل رمز التحقق المرسل إليك' : mode === 'login' ? 'أدخل بياناتك لتسجيل الدخول' : 'أنشئ حسابك الجديد'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'form' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRequestOtpSubmit(e);
              }}
              className="space-y-4"
            >
              {/* Tab bar */}
              <div className="flex rounded-lg overflow-hidden border border-border mb-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); clearError(); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); clearError(); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  إنشاء حساب
                </button>
              </div>

              {mode === 'register' && (
              <div>
                <label className="block text-sm mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearLocalError();
                  }}
                  placeholder="الاسم الكامل"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {fullName.length > 0 && !fullNameValid && (
                  <p className="text-xs text-destructive mt-1" role="alert">الاسم الكامل يجب أن يكون حرفين على الأقل</p>
                )}
              </div>
              )}

              <div>
                <label className="block text-sm mb-2">البريد الإلكتروني</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearLocalError();
                  }}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {email.length > 0 && !emailValid && (
                  <p className="text-xs text-destructive mt-1" role="alert">البريد الإلكتروني غير صالح</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearLocalError();
                  }}
                  placeholder="********"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {password.length > 0 && !passwordValid && (
                  <p className="text-xs text-destructive mt-1" role="alert">كلمة المرور يجب أن تكون على الأقل 8 أحرف</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">رقم الجوال (ليبيا)</label>
                <div className="relative">
                  <Phone
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearLocalError();
                    }}
                    placeholder="+218 91 234 5678"
                    className="w-full pr-10 pl-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  مثال: 09XXXXXXXX أو +218 91 234 5678
                </p>
                {validation.ok && validation.e164 && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    الصيغة: <span className="font-mono">{formatLibyaPhoneDisplay(validation.e164)}</span>
                  </p>
                )}
              </div>

              {mode === 'register' && (
              <div>
                <label className="block text-sm mb-2">المستوى التعليمي</label>
                <select
                  value={educationalLevel}
                  onChange={(e) => {
                    setEducationalLevel(e.target.value);
                    clearLocalError();
                  }}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="preparatory">إعدادي</option>
                  <option value="secondary">ثانوي</option>
                  <option value="university">جامعي</option>
                </select>
              </div>
              )}

              {!validation.ok && validation.messageAr && (
                <p className="text-sm text-destructive" role="alert">
                  {validation.messageAr}
                </p>
              )}

              {displayError && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3" role="alert">
                  {displayError}
                </div>
              )}

              <button
                type="submit"
                formNoValidate
                disabled={loading || !canSubmitRequest}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                تم إرسال رمز التحقق إلى <span className="font-medium text-foreground">{displayPhone || '—'}</span>
              </p>

              <div>
                <label className="block text-sm mb-2">رمز التحقق ({OTP_LENGTH} أرقام)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                    clearLocalError();
                  }}
                  placeholder="1234"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest"
                />
              </div>

              {displayError && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3" role="alert">
                  {displayError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.replace(/\D/g, '').slice(0, OTP_LENGTH).length < OTP_LENGTH}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCountdown > 0 ? `إعادة الإرسال بعد ${resendCountdown} ثانية` : 'إعادة إرسال الرمز'}
                </button>
                <button type="button" onClick={goBackToForm} className="text-sm text-muted-foreground hover:text-foreground">
                  تغيير البيانات
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
