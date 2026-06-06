"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { KeyRound, LockKeyhole, MailCheck, ShieldCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const scenes = {
  login: {
    title: "Trader Login",
    subtitle: "Protected trading access",
    Icon: LockKeyhole,
    accent: "from-blue-500 to-cyan-400"
  },
  register: {
    title: "Create Account",
    subtitle: "Profile, country, and verification",
    Icon: UserPlus,
    accent: "from-emerald-500 to-blue-500"
  },
  verify: {
    title: "Email OTP",
    subtitle: "10-minute verification",
    Icon: MailCheck,
    accent: "from-green-500 to-cyan-500"
  },
  reset: {
    title: "Password Reset",
    subtitle: "OTP and payout lock",
    Icon: KeyRound,
    accent: "from-amber-500 to-blue-500"
  },
  admin: {
    title: "Admin Console",
    subtitle: "Users, roles, and controls",
    Icon: ShieldCheck,
    accent: "from-indigo-500 to-blue-500"
  }
};

function getScene(pathname: string) {
  if (pathname.includes("/admin/login")) return scenes.admin;
  if (pathname.includes("/register")) return scenes.register;
  if (pathname.includes("/verify-email")) return scenes.verify;
  if (pathname.includes("/forgot-password") || pathname.includes("/reset-password")) return scenes.reset;
  return scenes.login;
}

export function AuthSideVisual({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const scene = useMemo(() => getScene(pathname ?? ""), [pathname]);
  const Icon = scene.Icon;

  return (
    <div className={cn("relative mx-auto w-full max-w-xl", compact ? "mt-10" : "my-8")}>
      <div className="relative h-[25rem] overflow-hidden rounded-lg border border-slate-200/70 bg-white/60 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", scene.accent)} />
        <div className="absolute left-8 top-8 flex items-center gap-3">
          <span className={cn("grid h-12 w-12 place-items-center rounded-md bg-gradient-to-br text-white shadow-lg", scene.accent)}>
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-500 dark:text-slate-300">{scene.subtitle}</span>
            <span className="block text-2xl font-semibold text-slate-950 dark:text-white">{scene.title}</span>
          </span>
        </div>

        <div className="absolute left-8 right-8 top-32 grid grid-cols-9 items-end gap-2">
          {[42, 72, 54, 86, 64, 112, 76, 96, 58].map((height, index) => (
            <span
              key={height + index}
              className={cn(
                "animate-candle-float rounded-full",
                index % 3 === 0 ? "bg-profit" : index % 3 === 1 ? "bg-primary" : "bg-cyan-400"
              )}
              style={{ height, animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>

        <div className="absolute bottom-8 left-8 right-8 grid grid-cols-[1fr_8rem] gap-4">
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
            <span className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-white/10" />
            <span className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
            <span className={cn("h-10 rounded-md bg-gradient-to-r", scene.accent)} />
          </div>
          <div className="animate-float-slow grid place-items-center rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/70">
            <img src="/pwa-icon-512.png" alt="" className="h-14 w-14 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
