/**
 * Author: Yushan WANG (authentication context and persistence)
 */

import React, { createContext, useContext, useMemo, useState } from "react";

export type AuthUser = {
  id: string | number;
  username: string;
  email?: string | null;
  role?: string | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  setAuth: (next: AuthState) => void;
  logout: () => void;
};

const STORAGE_KEY = "intellisched.auth.v1";

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as AuthState;
    return {
      token: typeof parsed.token === "string" ? parsed.token : null,
      user: parsed.user ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
}

function saveToStorage(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialState(): AuthState {
  if (typeof window === "undefined") return { token: null, user: null };
  return loadFromStorage();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getInitialState().token);
  const [user, setUser] = useState<AuthUser | null>(() => getInitialState().user);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      setAuth: (next) => {
        setToken(next.token);
        setUser(next.user);
        saveToStorage(next);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        saveToStorage({ token: null, user: null });
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

