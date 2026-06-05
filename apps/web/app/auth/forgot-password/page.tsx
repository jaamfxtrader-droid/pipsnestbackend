"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const pushToast = useToast((state) => state.push);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiFetch<{ email: string; message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      pushToast({ title: "Reset OTP sent", message: data.message, tone: "success" });
      router.replace(`/auth/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      pushToast({
        title: "Unable to send OTP",
        message: error instanceof Error ? error.message : "Please try again.",
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
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A 4-digit OTP will be sent to your email.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              type="email"
            />
          </div>
        </label>
        <Button type="submit" disabled={loading || !email}>
          {loading ? "Sending OTP" : "Send OTP"}
        </Button>
      </form>
    </div>
  );
}
