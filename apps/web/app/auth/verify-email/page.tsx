"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, RefreshCw } from "lucide-react";
import { OtpCodeInput } from "@/components/forms/otp-code-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type VerifyResponse = {
  token: string;
  user: AuthUser;
  message: string;
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const pushToast = useToast((state) => state.push);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const queryEmail = new URLSearchParams(window.location.search).get("email") ?? "";
    setEmail(queryEmail);
  }, []);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length !== 6) {
      pushToast({ title: "Enter OTP", message: "Please enter the 6-digit code from your email.", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<VerifyResponse>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, otp })
      });
      setAuth(data.token, data.user, { remember: true, scope: "user" });
      pushToast({ title: "Email verified", message: data.message, tone: "success" });
      router.replace("/dashboard");
    } catch (error) {
      pushToast({
        title: "Verification failed",
        message: error instanceof Error ? error.message : "Please check the OTP and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setResending(true);
    try {
      const data = await apiFetch<{ emailSent?: boolean; message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      pushToast({
        title: data.emailSent ? "OTP sent" : "OTP not sent",
        message: data.message,
        tone: data.emailSent ? "success" : "error"
      });
    } catch (error) {
      pushToast({
        title: "Unable to resend",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-profit/10 text-profit">
        <MailCheck className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold">Verify Email</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter the 6-digit OTP sent to your email.</p>

      <form onSubmit={handleVerify} className="mt-6 grid gap-4 text-left">
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          OTP
          <OtpCodeInput length={6} value={otp} onChange={setOtp} disabled={loading} />
        </label>

        <Button type="submit" disabled={loading || !email}>
          {loading ? "Verifying" : "Confirm OTP"}
        </Button>
      </form>

      <button
        type="button"
        onClick={resendOtp}
        disabled={resending || !email}
        className="mx-auto mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={resending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Resend OTP
      </button>
    </div>
  );
}
