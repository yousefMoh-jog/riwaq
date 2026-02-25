import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../lib/auth.service';
import { getApiErrorMessage } from '../lib/utils';

interface User {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  role: string;
  educationalLevel?: string;
  createdAt?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithOtp: (phoneE164: string, email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    authService
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser({
          id: me.id,
          phone: me.phone,
          fullName: me.fullName ?? null,
          email: me.email ?? null,
          role: me.role,
          educationalLevel: me.educationalLevel,
          createdAt: me.createdAt,
        });
      })
      .catch(() => {
        if (cancelled) return;
        authService.logout();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const loginWithOtp = useCallback(async (phoneE164: string, email: string, code: string) => {
    setError(null);
    try {
      const data = await authService.verifyOtp(phoneE164, email, code);

      if (!data.accessToken) {
        throw new Error('لم يتم استلام رمز الدخول');
      }

      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      if (!data.user) {
        throw new Error('لم يتم استلام بيانات المستخدم');
      }

      setUser({
        id: data.user.id,
        phone: data.user.phone ?? '',
        fullName: data.user.fullName ?? null,
        email: data.user.email ?? null,
        role: data.user.role ?? 'STUDENT',
        educationalLevel: data.user.educationalLevel,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }, [navigate]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    loginWithOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
