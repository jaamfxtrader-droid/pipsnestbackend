"use client";

import { create } from "zustand";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
  referralCode?: string | null;
  status?: "PENDING" | "APPROVED";
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorConfirmedAt?: string | null;
  kycStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  passwordChangedAt?: string | null;
  payoutHoldUntil?: string | null;
  blockedAt?: string | null;
  blockedUntil?: string | null;
  blockReason?: string | null;
  role: "TRADER" | "ADMIN" | "SUPER_ADMIN";
  permissions?: string[];
};

export type AuthScope = "user" | "admin";

type AuthState = {
  token?: string;
  user?: AuthUser;
  scope?: AuthScope;
  setAuth: (token: string, user: AuthUser, options?: { remember?: boolean; scope?: AuthScope }) => void;
  hydrate: (scope?: AuthScope) => void;
  logout: (scope?: AuthScope) => void;
};

function authKeys(scope: AuthScope = "user") {
  return scope === "admin"
    ? { token: "pipnest_admin_token", user: "pipnest_admin_user" }
    : { token: "pipnest_token", user: "pipnest_user" };
}

export function getStoredAuthToken(scope: AuthScope = "user") {
  if (typeof window === "undefined") return undefined;
  const keys = authKeys(scope);
  return window.localStorage.getItem(keys.token) ?? window.sessionStorage.getItem(keys.token) ?? undefined;
}

export function isRememberedAuth(scope: AuthScope = "user") {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(authKeys(scope).token));
}

function writeAuthCookie(token: string, remember?: boolean, scope: AuthScope = "user") {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  document.cookie = `${authKeys(scope).token}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookie(scope: AuthScope = "user") {
  document.cookie = `${authKeys(scope).token}=; path=/; max-age=0; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>((set) => ({
  setAuth: (token, user, options) => {
    if (typeof window !== "undefined") {
      const scope = options?.scope ?? "user";
      const keys = authKeys(scope);
      const storage = options?.remember ? window.localStorage : window.sessionStorage;
      window.localStorage.removeItem(keys.token);
      window.sessionStorage.removeItem(keys.token);
      window.localStorage.removeItem(keys.user);
      window.sessionStorage.removeItem(keys.user);
      storage.setItem(keys.token, token);
      storage.setItem(keys.user, JSON.stringify(user));
      writeAuthCookie(token, options?.remember, scope);
    }
    set({ token, user, scope: options?.scope ?? "user" });
  },
  hydrate: (scope = "user") => {
    if (typeof window === "undefined") return;
    const keys = authKeys(scope);
    const token = window.localStorage.getItem(keys.token) ?? window.sessionStorage.getItem(keys.token) ?? undefined;
    const rawUser = window.localStorage.getItem(keys.user) ?? window.sessionStorage.getItem(keys.user);
    const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : undefined;
    if (token) writeAuthCookie(token, Boolean(window.localStorage.getItem(keys.token)), scope);
    set({ token, user, scope });
  },
  logout: (scope = "user") => {
    if (typeof window !== "undefined") {
      const keys = authKeys(scope);
      window.localStorage.removeItem(keys.token);
      window.sessionStorage.removeItem(keys.token);
      window.localStorage.removeItem(keys.user);
      window.sessionStorage.removeItem(keys.user);
      clearAuthCookie(scope);
    }
    set({ token: undefined, user: undefined, scope });
  }
}));
