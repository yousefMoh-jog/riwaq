/**
 * Libya mobile: E.164 +218 + 9 digits (9 + 8 digits).
 * Normalize to +2189XXXXXXXX. Strict validation + Arabic error messages.
 */

const LIBYA_E164_REGEX = /^\+2189\d{8}$/;

export function normalizeLibyaPhoneToE164(input: string): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';

  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('218')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('9') || digits.length !== 9) return '';
  return `+218${digits}`;
}

export interface ValidateLibyaPhoneResult {
  ok: boolean;
  e164?: string;
  messageAr?: string;
}

export function validateLibyaPhone(input: string): ValidateLibyaPhoneResult {
  const raw = (input ?? '').trim();
  if (!raw) {
    return { ok: false, messageAr: 'أدخل رقم الهاتف' };
  }

  const e164 = normalizeLibyaPhoneToE164(raw);
  if (!e164) {
    return { ok: false, messageAr: 'رقم الهاتف غير صالح. استخدم 09XXXXXXXX أو +218 9X XXX XXXX' };
  }

  if (!LIBYA_E164_REGEX.test(e164)) {
    return { ok: false, messageAr: 'رقم الهاتف يجب أن يكون بصيغة: +2189XXXXXXXX' };
  }

  return { ok: true, e164 };
}

export function formatLibyaPhoneDisplay(e164: string): string {
  const m = e164.match(/^\+218(9)(\d{2})(\d{3})(\d{3})$/);
  if (!m) return e164;
  return `+218 ${m[1]}${m[2]} ${m[3]} ${m[4]}`;
}
