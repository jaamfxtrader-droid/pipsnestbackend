"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { canAccessAdminHref, firstAllowedAdminHref } from "@/lib/admin-permissions";
import { getStoredAuthToken, isRememberedAuth, useAuthStore } from "@/store/auth-store";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  role: "TRADER" | "ADMIN" | "SUPER_ADMIN";
  permissions?: string[];
};

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useAuthStore((state) => state.hydrate);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  useEffect(() => {
    const authToken = getStoredAuthToken("admin");

    if (!authToken) {
      router.replace("/admin/login");
      return;
    }

    apiFetch<{ user: AdminUser }>("/auth/me", { token: authToken })
      .then(({ user }) => {
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
          logout("admin");
          router.replace("/admin/login");
          return;
        }
        setAuth(authToken, user, { remember: isRememberedAuth("admin"), scope: "admin" });
        const currentPath = pathname ?? "/admin";
        if (!canAccessAdminHref(user, currentPath)) {
          router.replace(firstAllowedAdminHref(user) ?? "/admin/login");
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        logout("admin");
        router.replace("/admin/login");
      });
  }, [logout, pathname, router, setAuth]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm font-semibold">Checking admin access</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
