"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPasswordStrength, isStrongPassword } from "@pipnest/shared";
import { CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { OtpCodeInput } from "@/components/forms/otp-code-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const pushToast = useToast((state) => state.push);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthColor = strength.score <= 1 ? "bg-loss" : strength.score <= 3 ? "bg-warning" : strength.score === 4 ? "bg-primary" : "bg-profit";

  useEffect(() => {
    const queryEmail = new URLSearchParams(window.location.search).get("email") ?? "";
    setEmail(queryEmail);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length !== 4) {
      pushToast({ title: "Enter OTP", message: "Please enter the 4-digit reset code.", tone: "error" });
      return;
    }
    if (!isStrongPassword(password)) {
      pushToast({ title: "Weak password", message: "Use uppercase, lowercase, number, and symbol.", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password })
      });
      pushToast({ title: "Password changed", message: data.message, tone: "success" });
      router.replace("/auth/login");
    } catch (error) {
      pushToast({
        title: "Reset failed",
        message: error instanceof Error ? error.message : "Please check the OTP and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Confirm the OTP and create a strong password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" type="email" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          OTP
          <OtpCodeInput length={4} value={otp} onChange={setOtp} disabled={loading} />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          New password
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <PasswordInput className="pl-9" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" />
          </div>
        </label>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">Password strength</span>
            <span className={cn("rounded-full px-2 py-1", password && isStrongPassword(password) ? "bg-profit/10 text-profit" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300")}>
              {password ? strength.label : "Required"}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <span className={cn("block h-full rounded-full transition-all", strengthColor)} style={{ width: `${password ? strength.percent : 0}%` }} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {strength.rules.map((rule) => (
              <span key={rule.id} className={cn("flex items-center gap-2", rule.passed && "text-profit")}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {rule.label}
              </span>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading || !email}>
          {loading ? "Updating password" : "Change Password"}
        </Button>
      </form>

      <Link href="/auth/forgot-password" className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-blue-700">
        Send a new OTP
      </Link>
    </div>
  );
}
