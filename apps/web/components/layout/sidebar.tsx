"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { dashboardLinks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-r border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-white/10">
        <BrandLogo compact />
        <ThemeToggle />
      </div>
      <nav className="grid gap-1 p-3">
        {dashboardLinks.map((link) => {
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
      <div className="mt-auto p-3">
        <Button variant="ghost" className="w-full justify-start">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
}
