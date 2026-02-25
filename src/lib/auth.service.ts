import { api } from './api';
import { validateLibyaPhone } from './phone';
export { getApiErrorMessage } from './utils';

export interface MeUser {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  role: string;
  educationalLevel?: string;
  createdAt?: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken?: string;
  user?: {
    id: string;
    phone: string;
    fullName: string | null;
    email: string | null;
    role: string;
    educationalLevel?: string;
  };
}

export type RequestOtpResult =
  | { ok: true }
  | { ok: false; messageAr: string };

export async function requestOtp(
  fullName: string,
  email: string,
  password: string,
  phoneInput: string,
  educationalLevel: string
): Promise<RequestOtpResult> {
  const validation = validateLibyaPhone(phoneInput);
  if (!validation.ok) {
    return { ok: false, messageAr: validation.messageAr ?? 'رقم الهاتف غير صالح' };
  }
  const phoneE164 = validation.e164!;

  try {
    const res = await api.post<{ ok?: boolean; messageAr?: string }>('/auth/request-otp', {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phoneE164,
      educationalLevel,
    });
    const data = res.data;
    if (data && data.ok === false && typeof data.messageAr === 'string') {
      return { ok: false, messageAr: data.messageAr };
    }
    return { ok: true };
  } catch (err: unknown) {
    const ax = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: Record<string, unknown> } }).response
      : undefined;
    const data = ax?.data;
    const messageAr =
      (data && typeof data.messageAr === 'string' && data.messageAr) ||
      (data && typeof data.message === 'string' && data.message) ||
      (data && typeof data.error === 'string' && data.error);
    return {
      ok: false,
      messageAr: messageAr || (err instanceof Error ? err.message : 'حدث خطأ. يرجى المحاولة مرة أخرى.'),
    };
  }
}

export async function verifyOtp(
  phoneE164: string,
  email: string,
  code: string
): Promise<VerifyOtpResponse> {
  const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
    phone: phoneE164,
    email: email.trim(),
    code: code.trim(),
  });
  return data;
}

export const authService = {
  requestOtp,
  verifyOtp,
  async me(): Promise<MeUser> {
    const { data } = await api.get<MeUser>('/auth/me');
    return data;
  },
  logout(): void {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {}
  },
  getToken(): string | null {
    try {
      return localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  },
};

