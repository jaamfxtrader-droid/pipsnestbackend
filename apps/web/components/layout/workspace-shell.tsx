"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { apiFetch } from "@/lib/api";
import { canAccessAdminHref } from "@/lib/admin-permissions";
import { adminLinks, dashboardLinks } from "@/lib/mock-data";
import { defaultSiteSettings, getSiteSettings } from "@/lib/site-settings";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";
import { type AuthUser, getStoredAuthToken, isRememberedAuth, useAuthStore } from "@/store/auth-store";
import { BrandLogo } from "./brand-logo";
// import { LanguageSelector } from "./language-selector";
import { NotificationBell } from "./notification-bell";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

type WorkspaceShellProps = {
  children: ReactNode;
  variant: "dashboard" | "admin";
};

const shellCopy = {
  dashboard: {
    eyebrow: "Trader workspace",
    title: "Dashboard",
    links: dashboardLinks
  },
  admin: {
    eyebrow: "Pipnest operations",
    title: "Admin Console",
    links: adminLinks
  }
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Avatar({ src, initials, className, verified = false }: { src?: string | null; initials: string; className?: string; verified?: boolean }) {
  const badge = verified ? (
    <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-[#07152d]">
      <BadgeCheck className="h-3 w-3 fill-current" />
    </span>
  ) : null;

  if (src) {
    return (
      <span className={cn("relative shrink-0", className)}>
        <img
          src={src}
          alt=""
          className="h-10 w-10 rounded-full bg-slate-200 object-cover ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10"
        />
        {badge}
      </span>
    );
  }

  return (
    <span className={cn("relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950", className)}>
      <span>{initials}</span>
      {badge}
    </span>
  );
}

function SidebarTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tooltip relative flex justify-center overflow-visible">
      {children}
      <span className="pointer-events-none absolute left-[calc(100%+0.85rem)] top-1/2 z-[70] -translate-y-1/2 whitespace-nowrap rounded-lg border border-blue-400/20 bg-[#07152d] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-[0_16px_36px_rgba(0,0,0,0.28)] ring-1 ring-white/10 transition duration-200 before:absolute before:left-[-5px] before:top-1/2 before:h-2.5 before:w-2.5 before:-translate-y-1/2 before:rotate-45 before:border-b before:border-l before:border-blue-400/20 before:bg-[#07152d] group-hover/tooltip:translate-x-0.5 group-hover/tooltip:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function WorkspaceShell({ children, variant }: WorkspaceShellProps) {
  const router = useRouter();
  const { tx } = useTranslation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);
  const copy = shellCopy[variant];
  const authScope = variant === "admin" ? "admin" : "user";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const currentPathname = pathname ?? "";
  const fallbackName = variant === "admin" ? "Hash24 Super Admin" : "Demo Trader";
  const fallbackEmail = variant === "admin" ? "admin@pipnestfunding.com" : "trader@pipnestfunding.com";
  const displayName = user?.name ?? fallbackName;
  const displayEmail = user?.email ?? fallbackEmail;
  const displayAvatar = user?.avatarUrl;
  const verified = variant !== "admin" && user?.kycStatus === "APPROVED";
  const initials = initialsFor(displayName) || "PN";
  const visibleLinks = variant === "admin" ? copy.links.filter((link) => canAccessAdminHref(user, link.href)) : copy.links;

  useEffect(() => {
    hydrate(authScope);
  }, [authScope, hydrate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    getSiteSettings().then((siteSettings) => {
      if (!cancelled) setSiteSettings(siteSettings);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const authToken = getStoredAuthToken(authScope);
      if (!authToken) return;

      try {
        const { user: freshUser } = await apiFetch<{ user: AuthUser }>("/auth/me", { token: authToken });
        if (cancelled) return;
        setAuth(authToken, freshUser, { remember: isRememberedAuth(authScope), scope: authScope });
      } catch {
        if (cancelled) return;
        logout(authScope);
        router.replace(authScope === "admin" ? "/admin/login" : "/auth/login");
      }
    }

    verifySession();
    const interval = window.setInterval(verifySession, 10_000);
    window.addEventListener("focus", verifySession);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", verifySession);
    };
  }, [authScope, logout, router, setAuth]);

  function handleLogout() {
    logout(authScope);
    router.push(variant === "admin" ? "/admin/login" : "/auth/login");
  }

  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_48%,#eff6ff_100%)] transition-[width] duration-300 dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,#071a34_0%,#061126_48%,#0c1f3b_100%)] lg:flex",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div
          className={cn(
            "relative flex h-16 items-center border-b border-slate-200 px-4 dark:border-blue-400/15",
            collapsed ? "justify-center px-2" : "justify-between"
          )}
        >
          <BrandLogo compact={collapsed} />
          <div className={cn("flex items-center gap-2", collapsed && "absolute -right-4 top-1/2 z-[60] -translate-y-1/2")}>
            {!collapsed ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                <Shield className="h-3.5 w-3.5" />
                {variant === "admin" ? "Admin" : "Trader"}
              </span>
            ) : null}
            <SidebarTooltip label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <button
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                className={cn(
                  "grid place-items-center border text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary dark:text-slate-100 dark:hover:text-white",
                  collapsed
                    ? "h-9 w-9 rounded-xl border-blue-200 bg-white/95 shadow-[0_12px_28px_rgba(37,99,235,0.22)] dark:border-blue-400/25 dark:bg-[#102244]"
                    : "h-8 w-8 rounded-md border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                )}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ToggleIcon className="h-4 w-4" />
              </button>
            </SidebarTooltip>
          </div>
        </div>

        <nav className={cn("grid gap-2 p-3", collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden")}>
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = isActivePath(currentPathname, link.href);
            const navItem = (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => event.currentTarget.blur()}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ring-1 ring-transparent transition",
                  collapsed && "mx-auto w-11 justify-center px-0",
                  active
                    ? "bg-gradient-to-r from-primary to-blue-500 text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] ring-blue-300/30"
                    : "text-slate-600 hover:bg-white/80 hover:text-primary hover:shadow-sm dark:text-slate-300 dark:hover:bg-blue-400/10 dark:hover:text-white dark:hover:ring-blue-400/15"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{tx(link.label)}</span> : null}
              </Link>
            );

            return collapsed ? (
              <SidebarTooltip key={link.href} label={tx(link.label)}>
                {navItem}
              </SidebarTooltip>
            ) : (
              navItem
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3 border-t border-slate-200 p-3 dark:border-blue-400/15">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <SidebarTooltip label="Install web app">
                <PwaInstallButton label="" className="h-11 w-11 px-0" />
              </SidebarTooltip>
              <SidebarTooltip label="Google Play">
                {siteSettings.androidAppEnabled && !siteSettings.androidAppComingSoon ? (
                  <Link href={siteSettings.androidAppUrl} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-lg text-[10px] font-black text-primary transition hover:bg-primary/10 hover:text-blue-700 dark:hover:bg-white/10">
                    Play
                  </Link>
                ) : (
                  <span className="grid h-11 w-11 cursor-not-allowed place-items-center rounded-lg text-[10px] font-black text-primary opacity-50">Soon</span>
                )}
              </SidebarTooltip>
              <SidebarTooltip label="App Store">
                {siteSettings.iosAppEnabled && !siteSettings.iosAppComingSoon ? (
                  <Link href={siteSettings.iosAppUrl} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-lg text-[10px] font-black text-primary transition hover:bg-primary/10 hover:text-blue-700 dark:hover:bg-white/10">
                    iOS
                  </Link>
                ) : (
                  <span className="grid h-11 w-11 cursor-not-allowed place-items-center rounded-lg text-[10px] font-black text-primary opacity-50">Soon</span>
                )}
              </SidebarTooltip>
            </div>
          ) : (
            <div className="grid gap-2 px-1">
              <PwaInstallButton label="Install app" className="w-full justify-center" />
              {siteSettings.androidAppEnabled && !siteSettings.androidAppComingSoon ? (
                <Link href={siteSettings.androidAppUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md transition hover:opacity-90" aria-label="Download on Google Play">
                  <Image src="/play-store-badge.svg" alt="Download on Google Play" width={154} height={46} className="h-9 w-auto" />
                </Link>
              ) : (
                <span className="relative inline-flex h-11 cursor-not-allowed items-center justify-center rounded-md opacity-55">
                  <Image src="/play-store-badge.svg" alt="Google Play coming soon" width={154} height={46} className="h-9 w-auto" />
                  <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">Soon</span>
                </span>
              )}
              {siteSettings.iosAppEnabled && !siteSettings.iosAppComingSoon ? (
                <Link href={siteSettings.iosAppUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md transition hover:opacity-90" aria-label="Download on the App Store">
                  <Image src="/app-store-badge.svg" alt="Download on the App Store" width={154} height={46} className="h-9 w-auto" />
                </Link>
              ) : (
                <span className="relative inline-flex h-11 cursor-not-allowed items-center justify-center rounded-md opacity-55">
                  <Image src="/app-store-badge.svg" alt="App Store coming soon" width={154} height={46} className="h-9 w-auto" />
                  <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">Soon</span>
                </span>
              )}
            </div>
          )}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <SidebarTooltip label={displayName}>
                <span className="grid h-11 w-11 place-items-center">
                  <Avatar src={displayAvatar} initials={initials} verified={verified} />
                </span>
              </SidebarTooltip>
              <SidebarTooltip label="Logout">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="grid h-11 w-11 place-items-center rounded-lg text-loss transition hover:bg-loss/10 hover:ring-1 hover:ring-loss/20"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </SidebarTooltip>
            </div>
          ) : (
            <div className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:ring-white/10">
              <div className="flex items-center gap-3">
                <Avatar src={displayAvatar} initials={initials} verified={verified} />
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                      <span className="truncate">{displayName}</span>
                      {verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-600 text-blue-600" /> : null}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{displayEmail}</span>
                  </span>
                ) : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => setConfirmLogout(true)} className="mt-3 w-full justify-start text-loss hover:bg-loss/10" aria-label="Logout">
                <LogOut className="h-4 w-4" />
                {tx("Logout")}
              </Button>
            </div>
          )}
        </div>
      </aside>

      <div className={cn("min-h-screen transition-[padding] duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-30 px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex w-full items-center justify-between gap-2 sm:gap-3 lg:justify-end">
            <div className="inline-flex min-w-0 items-center rounded-2xl border border-slate-200 bg-white/85 p-1.5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#07152d]/85 lg:hidden">
              <BrandLogo compact />
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 p-1.5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#07152d]/85 lg:inline-flex">
              {/* Translation selector hidden for now until full-site translation is complete. */}
              {/* <LanguageSelector compact /> */}
              <ThemeToggle />
              <NotificationBell />
              <ProfileMenu variant={variant} compact />
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/85 p-1 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#07152d]/85 min-[390px]:gap-2 min-[390px]:p-1.5 lg:hidden">
              <ProfileMenu variant={variant} compact />
              <NotificationBell />
              <Button type="button" variant="ghost" className="h-11 w-11 rounded-full p-0 min-[390px]:h-12 min-[390px]:w-12" aria-label="Open menu" title="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-6 w-6 stroke-[2.6] min-[390px]:h-7 min-[390px]:w-7" />
              </Button>
            </div>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute right-0 top-0 flex max-h-dvh w-[min(88vw,23rem)] flex-col overflow-hidden border-l border-slate-200 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/95">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10">
                <BrandLogo compact />
                <Button type="button" variant="ghost" className="h-12 w-12 rounded-full p-0" aria-label="Close menu" title="Close menu" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-7 w-7 stroke-[2.5]" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
                <div className="grid gap-2">
                  {visibleLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActivePath(currentPathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                          active
                            ? "bg-gradient-to-r from-primary to-blue-500 text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {tx(link.label)}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/75 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  {/* Translation selector hidden for now until full-site translation is complete. */}
                  {/* <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Language</span>
                    <LanguageSelector compact />
                  </div> */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="mt-5 grid gap-2 px-1">
                  <PwaInstallButton label="Install app" className="w-full justify-center" />
                  {siteSettings.androidAppEnabled && !siteSettings.androidAppComingSoon ? (
                    <Link href={siteSettings.androidAppUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md transition hover:opacity-90" aria-label="Download on Google Play">
                      <Image src="/play-store-badge.svg" alt="Download on Google Play" width={154} height={46} className="h-9 w-auto" />
                    </Link>
                  ) : (
                    <span className="relative inline-flex h-11 cursor-not-allowed items-center justify-center rounded-md opacity-55">
                      <Image src="/play-store-badge.svg" alt="Google Play coming soon" width={154} height={46} className="h-9 w-auto" />
                      <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">Soon</span>
                    </span>
                  )}
                  {siteSettings.iosAppEnabled && !siteSettings.iosAppComingSoon ? (
                    <Link href={siteSettings.iosAppUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md transition hover:opacity-90" aria-label="Download on the App Store">
                      <Image src="/app-store-badge.svg" alt="Download on the App Store" width={154} height={46} className="h-9 w-auto" />
                    </Link>
                  ) : (
                    <span className="relative inline-flex h-11 cursor-not-allowed items-center justify-center rounded-md opacity-55">
                      <Image src="/app-store-badge.svg" alt="App Store coming soon" width={154} height={46} className="h-9 w-auto" />
                      <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">Soon</span>
                    </span>
                  )}
                </div>

                <div className="mt-5 rounded-lg bg-slate-50/75 p-3 ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:ring-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar src={displayAvatar} initials={initials} verified={verified} />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                        <span className="truncate">{displayName}</span>
                        {verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-600 text-blue-600" /> : null}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{displayEmail}</span>
                    </span>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setConfirmLogout(true)} className="mt-3 w-full justify-start text-loss hover:bg-loss/10" aria-label="Logout">
                    <LogOut className="h-4 w-4" />
                    {tx("Logout")}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        <main>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
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
