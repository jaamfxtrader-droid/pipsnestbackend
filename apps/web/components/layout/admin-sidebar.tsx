"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { adminLinks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-r border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <BrandLogo compact />
          <span className="hidden items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 xl:flex">
            <Shield className="h-3.5 w-3.5" /> Admin
          </span>
        </div>
        <ThemeToggle />
      </div>
      <nav className="grid gap-1 p-3">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
                active && "bg-primary text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
