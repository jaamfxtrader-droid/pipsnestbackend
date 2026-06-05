import type { ReactNode } from "react";
import Link from "next/link";
import { AuthSideVisual } from "@/components/auth/auth-side-visual";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white lg:h-screen lg:overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden h-screen bg-[linear-gradient(135deg,rgba(37,99,235,0.16),transparent_55%),linear-gradient(45deg,rgba(34,197,94,0.12),transparent)] p-10 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.45),transparent_55%),linear-gradient(45deg,rgba(34,197,94,0.16),transparent)] lg:flex lg:flex-col lg:justify-between">
        <BrandLogo />
        <AuthSideVisual />
      </section>
      <section className="flex min-h-dvh flex-col lg:h-screen lg:min-h-0 lg:overflow-hidden">
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Link href="/" className="font-semibold lg:hidden">PipNest Markets</Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-start justify-center px-3 pb-6 pt-2 sm:px-4 lg:min-h-0 lg:items-center lg:py-4">{children}</div>
      </section>
    </main>
  );
}
