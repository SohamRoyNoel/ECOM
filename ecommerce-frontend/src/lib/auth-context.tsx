'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from './api-client';
import type { LoginResponse, User } from './types';

const STORAGE_KEY = 'ecommerce.auth';

interface StoredAuth {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: (reason?: 'expired' | 'manual') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAuth;
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch {
      // LOGOUT
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(identifier: string, password: string) {
    const result = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
    setToken(result.accessToken);
    setUser(result.user);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: result.accessToken, user: result.user } satisfies StoredAuth),
    );
  }

  async function logout(reason: 'expired' | 'manual' = 'manual') {
    const currentToken = token;
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);

    if (currentToken) {
      apiFetch('/auth/logout', { method: 'POST', token: currentToken }).catch(() => {});
    }

    router.push(reason === 'expired' ? '/login?reason=expired' : '/login');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>.');
  }
  return ctx;
}
