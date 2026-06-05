"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, ChevronDown, LayoutDashboard, LogOut, Settings, UserCircle } from "lucide-react";
import { firstAllowedAdminHref } from "@/lib/admin-permissions";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ProfileMenuProps = {
  variant?: "public" | "dashboard" | "admin";
  compact?: boolean;
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileMenu({ variant = "public", compact = false }: ProfileMenuProps) {
  const router = useRouter();
  const { tx } = useTranslation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fallbackName = variant === "admin" ? "Pipnest Admin" : "Demo Trader";
  const fallbackEmail = variant === "admin" ? "admin@pipnestfunding.com" : "trader@pipnestfunding.com";
  const name = user?.name ?? fallbackName;
  const email = user?.email ?? fallbackEmail;
  const initials = initialsFor(name) || "PN";
  const avatarUrl = user?.avatarUrl;
  const verified = variant !== "admin" && user?.kycStatus === "APPROVED";
  const profileHref = variant === "admin" ? "/admin/settings" : "/dashboard/profile";
  const homeHref = variant === "admin" ? firstAllowedAdminHref(user) ?? "/admin" : "/dashboard";
  const showProfileSettings = variant !== "admin" || user?.role === "SUPER_ADMIN";

  function handleLogout() {
    logout(variant === "admin" ? "admin" : "user");
    router.push(variant === "admin" ? "/admin/login" : "/auth/login");
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white",
          compact && "w-10 justify-center px-0"
        )}
        aria-label="Open profile menu"
        title="Profile"
        onClick={() => {
          if (variant === "public") router.push(profileHref);
        }}
      >
        <span className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full bg-slate-200 object-cover ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10" />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">
              {initials}
            </span>
          )}
          {verified ? (
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-[#07152d]">
              <BadgeCheck className="h-3 w-3 fill-current" />
            </span>
          ) : null}
        </span>
        {compact ? null : (
          <>
            <span className="hidden max-w-28 truncate sm:block">{name}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 transition group-hover:rotate-180 sm:block" />
          </>
        )}
      </button>

      <div className="invisible pointer-events-none absolute right-0 top-full z-50 w-72 origin-top translate-y-3 scale-95 pt-3 opacity-0 transition duration-200 ease-out group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#07152d]">
          <div className="border-b border-slate-200 p-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="relative shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full bg-slate-200 object-cover ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                    {initials}
                  </span>
                )}
                {verified ? (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-[#07152d]">
                    <BadgeCheck className="h-3.5 w-3.5 fill-current" />
                  </span>
                ) : null}
                </span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-950 dark:text-white">
                  <span className="truncate">{name}</span>
                  {verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-600 text-blue-600" /> : null}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{email}</span>
              </span>
            </div>
          </div>
          <div className="grid p-2 text-sm">
            <Link
              href={homeHref}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              {tx("Dashboard")}
            </Link>
            {showProfileSettings ? (
              <Link
                href={profileHref}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {variant === "admin" ? <Settings className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
                {tx(variant === "admin" ? "Admin settings" : "Profile settings")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-loss transition hover:bg-loss/10"
            >
              <LogOut className="h-4 w-4" />
              {tx("Logout")}
            </button>
          </div>
        </div>
      </div>
      <Modal open={confirmLogout} title="Confirm Logout" onClose={() => setConfirmLogout(false)}>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{tx("Are you sure you want to logout from this session?")}</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setConfirmLogout(false)}>
            {tx("Cancel")}
          </Button>
          <Button type="button" variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            {tx("Logout")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
