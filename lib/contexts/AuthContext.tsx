"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const TOKEN_KEY = "hm_auth_token";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser, method: "password" | "discord") => void;
  logout: () => void;
}

function logLogin(user: AuthUser, method: "password" | "discord") {
  try {
    fetch("/api/log-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        method,
        url: window.location.href,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let logging break the login flow
  }
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    setToken(saved);
    getMe().then((u) => {
      if (u) {
        setUser(u);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback((t: string, u: AuthUser, method: "password" | "discord") => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    logLogin(u, method);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
