import Link from "next/link";
import { Suspense } from "react";
import { UserPlus } from "lucide-react";
import { AuthForm } from "@/components/forms/auth-form";

export default function RegisterPage() {
  return (
    <div className="flex w-full max-w-2xl flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(37,99,235,0.14)] dark:border-white/10 dark:bg-white/[0.04] sm:p-5 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-hidden">
      <div className="flex shrink-0 items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start your trader profile and referral tracking.</p>
        </div>
      </div>
      <div className="mt-4 min-h-0 lg:overflow-y-auto lg:pr-1">
        <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />}>
          <AuthForm mode="register" />
        </Suspense>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/auth/login" className="text-primary">Login</Link>
        </p>
      </div>
    </div>
  );
}
