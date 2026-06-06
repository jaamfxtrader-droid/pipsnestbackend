"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, LogIn, Menu, ShieldCheck, UserPlus, X } from "lucide-react";
import { getCmsPages, type CmsPage } from "@/lib/cms";
import type { TranslationKey } from "@/lib/i18n";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
// import { LanguageSelector } from "./language-selector";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";
import { getStoredAuthToken, useAuthStore } from "@/store/auth-store";

const navLinks = [
  { href: "/funding-programs", label: "nav.funding" },
  { href: "/challenge-details", label: "nav.rules" },
  { href: "/how-it-works", label: "nav.how" },
  { href: "/payouts", label: "nav.payouts" },
  { href: "/affiliate", label: "nav.affiliate" }
];

const importantLinks = [
  { href: "/terms", label: "nav.terms" },
  { href: "/risk-disclosure", label: "nav.risk" },
  { href: "/kyc-policy", label: "nav.kyc" },
  { href: "/disclaimer", label: "nav.disclaimer" },
  { href: "/refund-policy", label: "nav.refund" },
  { href: "/privacy", label: "nav.privacy" }
];

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmsHeaderLinks, setCmsHeaderLinks] = useState<CmsPage[]>([]);

  useEffect(() => {
    hydrate("user");
    setHasStoredToken(Boolean(getStoredAuthToken("user")));
  }, [hydrate]);

  useEffect(() => {
    let mounted = true;
    const staticHrefs = new Set([...navLinks, ...importantLinks].map((link) => link.href));

    getCmsPages().then((pages) => {
      if (!mounted) return;
      setCmsHeaderLinks(
        pages.filter((page) => {
          const href = page.slug === "home" ? "/" : `/${page.slug}`;
          const placement = page.metadata?.navPlacement;
          return page.published !== false && !staticHrefs.has(href) && (placement === "header" || placement === "both");
        })
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const hasSession = Boolean((scope === "user" && token) || hasStoredToken);
  const closeMenu = () => setMenuOpen(false);
  const dynamicImportantLinks = cmsHeaderLinks.map((page) => ({
    href: page.slug === "home" ? "/" : `/${page.slug}`,
    label: page.metadata?.navLabel || page.title
  }));

  return (
    <header className="sticky top-0 z-50 px-3 py-3 sm:px-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="rounded-full border border-white/60 bg-white/55 px-3.5 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/55">
          <BrandLogo />
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/45 p-1 text-[13px] font-semibold text-slate-600 shadow-[0_18px_45px_rgba(15,23,42,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/55 dark:text-slate-300 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2.5 transition hover:bg-white/70 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white"
            >
              {t(link.label as TranslationKey)}
            </Link>
          ))}
          <div className="group relative">
            <button className="inline-flex items-center gap-1 rounded-full px-4 py-2.5 transition hover:bg-white/70 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white">
              {t("nav.important")} <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
            </button>
            <div className="invisible pointer-events-none absolute left-1/2 top-full z-50 w-64 origin-top -translate-x-1/2 translate-y-3 scale-95 pt-3 opacity-0 transition duration-300 ease-out group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
              <div className="rounded-2xl border border-white/70 bg-white/[0.82] p-2 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/[0.92]">
                <div className="mb-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("nav.required")}
                </div>
                {importantLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-primary hover:text-white dark:text-slate-200"
                  >
                    {t(link.label as TranslationKey)}
                  </Link>
                ))}
                {dynamicImportantLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-primary hover:text-white dark:text-slate-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/45 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/55 lg:flex">
          {/* Translation selector hidden for now until full-site translation is complete. */}
          {/* <LanguageSelector /> */}
          <ThemeToggle />
          {hasSession ? (
            <ProfileMenu compact />
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="h-10 rounded-full px-4">{t("nav.login")}</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="h-10 rounded-full px-5 shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                  {t("nav.signup")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/45 p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/55 lg:hidden">
          {hasSession ? <ProfileMenu compact /> : null}
          <Button variant="ghost" className="h-12 w-12 rounded-full p-0" aria-label="Open menu" title="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-7 w-7 stroke-[2.6]" />
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={closeMenu}
          />
          <aside className="absolute right-0 top-0 flex max-h-dvh w-[min(88vw,23rem)] flex-col overflow-hidden border-l border-white/60 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07152d]/95">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 p-4 dark:border-white/10">
              <BrandLogo />
              <Button variant="ghost" className="h-12 w-12 rounded-full p-0" aria-label="Close menu" title="Close menu" onClick={closeMenu}>
                <X className="h-7 w-7 stroke-[2.5]" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
              <div className="grid gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-primary hover:text-white dark:text-slate-200 dark:hover:bg-primary"
                  >
                    {t(link.label as TranslationKey)}
                  </Link>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-slate-200/80 bg-white/55 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("nav.required")}
                </div>
                <div className="grid gap-1">
                  {importantLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className="rounded-md px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-950 hover:text-white dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-950"
                    >
                      {t(link.label as TranslationKey)}
                    </Link>
                  ))}
                  {dynamicImportantLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className="rounded-md px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-950 hover:text-white dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-950"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 rounded-lg border border-slate-200/80 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.04]">
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

              <div className="mt-5 grid gap-2">
                {hasSession ? (
                  <Link href="/dashboard" onClick={closeMenu}>
                    <Button className="w-full justify-center">Dashboard <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={closeMenu}>
                      <Button variant="secondary" className="w-full justify-center">
                        <LogIn className="h-4 w-4" /> {t("nav.login")}
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={closeMenu}>
                      <Button className="w-full justify-center">
                        <UserPlus className="h-4 w-4" /> {t("nav.signup")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
