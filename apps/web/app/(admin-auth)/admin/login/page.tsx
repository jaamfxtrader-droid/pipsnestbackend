"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, UserRound } from "lucide-react";
import { AuthSideVisual } from "@/components/auth/auth-side-visual";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type AdminLoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    avatarUrl?: string | null;
    role: "ADMIN" | "SUPER_ADMIN";
    permissions?: string[];
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const pushToast = useToast((state) => state.push);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiFetch<AdminLoginResponse>("/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ username, password, rememberMe })
      });

      setAuth(data.token, data.user, { remember: rememberMe, scope: "admin" });
      const nextPath = new URLSearchParams(window.location.search).get("next") ?? "/admin";
      router.replace(nextPath);
    } catch (error) {
      pushToast({
        title: "Admin login failed",
        message: error instanceof Error ? error.message : "Please check the username and password.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-white p-10 text-slate-950 dark:bg-slate-950 dark:text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.16),transparent_46%),linear-gradient(45deg,rgba(34,197,94,0.12),transparent_60%)] dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.35),transparent_46%),linear-gradient(45deg,rgba(34,197,94,0.18),transparent_60%)]" />
        <div className="relative">
          <BrandLogo />
        </div>
        <div className="relative">
          <AuthSideVisual compact />
        </div>
      </section>

      <section className="flex min-h-screen flex-col">
        <div className="flex h-16 items-center justify-between px-6">
          <BrandLogo compact />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <form onSubmit={handleSubmit} autoComplete="off" className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold">Admin Login</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your assigned admin username.</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Username
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="off"
                    name="admin-login-username"
                    placeholder="Username"
                  />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Password
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <PasswordInput
                    className="pl-9 pr-11"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    name="admin-login-password"
                    placeholder="Enter admin password"
                  />
                </div>
              </label>

              <SwitchField checked={rememberMe} onChange={setRememberMe} label="Remember me" description="Keep this admin session signed in." />

              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? "Signing in" : "Login to Admin Panel"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
