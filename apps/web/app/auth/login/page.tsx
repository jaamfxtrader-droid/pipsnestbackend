import Link from "next/link";
import { Suspense } from "react";
import { LockKeyhole } from "lucide-react";
import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(37,99,235,0.14)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Trader Login</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Access your protected trader dashboard.</p>
        </div>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div className="h-56 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <div className="mt-5 flex justify-between text-sm text-slate-500 dark:text-slate-400">
        <Link href="/auth/forgot-password" className="hover:text-primary">Forgot password?</Link>
        <Link href="/auth/register" className="hover:text-primary">Create account</Link>
      </div>
    </div>
  );
}
