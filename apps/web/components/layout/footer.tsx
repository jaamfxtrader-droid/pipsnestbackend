"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, Instagram, Landmark, Linkedin, Send, Wallet, Youtube } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import { defaultSiteSettings, getSiteSettings } from "@/lib/site-settings";
import { useTranslation } from "@/lib/use-translation";
import { BrandLogo } from "./brand-logo";

const columns = [
  {
    title: "footer.company",
    links: [
      ["footer.about", "/about"],
      ["footer.contact", "/contact"],
      ["nav.affiliate", "/affiliate"],
      ["footer.faq", "/faq"]
    ]
  },
  {
    title: "footer.platform",
    links: [
      ["footer.programs", "/funding-programs"],
      ["nav.how", "/how-it-works"],
      ["nav.payouts", "/payouts"],
      ["footer.dashboard", "/dashboard"]
    ]
  },
  {
    title: "footer.legal",
    links: [
      ["nav.terms", "/terms"],
      ["nav.privacy", "/privacy"],
      ["nav.risk", "/risk-disclosure"],
      ["nav.kyc", "/kyc-policy"],
      ["nav.disclaimer", "/disclaimer"],
      ["nav.refund", "/refund-policy"]
    ]
  }
];

const paymentBadges = [
  { label: "Visa", icon: CreditCard, className: "border-blue-400/25 bg-blue-500/10 text-blue-700 dark:text-blue-200" },
  { label: "Mastercard", icon: CreditCard, className: "border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-200" },
  { label: "Bank", icon: Landmark, className: "border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" },
  { label: "Crypto", icon: Wallet, className: "border-cyan-400/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200" },
  { label: "Airtm", icon: Wallet, className: "border-violet-400/25 bg-violet-500/10 text-violet-700 dark:text-violet-200" },
  { label: "Skrill", icon: Wallet, className: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-200" }
];

export function Footer() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(defaultSiteSettings);

  useEffect(() => {
    let mounted = true;

    getSiteSettings().then((siteSettings) => {
      if (mounted) setSettings(siteSettings);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const socialLinks = [
    { href: settings.socialLinks.instagram, label: "Instagram", icon: Instagram },
    { href: settings.socialLinks.youtube, label: "YouTube", icon: Youtube },
    { href: settings.socialLinks.linkedin, label: "LinkedIn", icon: Linkedin },
    { href: settings.socialLinks.telegram, label: "Telegram", icon: Send }
  ].filter((social) => social.href);

  return (
    <footer className="border-t border-slate-200 bg-white py-12 dark:border-white/10 dark:bg-[#020817]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
            {t("footer.text")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-primary hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold">{t(column.title as TranslationKey)}</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-400">
                {column.links.map(([label, href]) => (
                  <Link key={href} href={href} className="transition hover:text-primary">
                    {t(label as TranslationKey)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 grid max-w-7xl gap-6 border-t border-slate-200 px-4 pt-8 sm:px-6 md:grid-cols-[1fr_auto_auto] md:items-center lg:px-8 dark:border-white/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("footer.cards")}</p>
          <div className="mt-3 flex max-w-xl flex-wrap gap-2">
            {paymentBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <span
                  key={badge.label}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-black uppercase tracking-wide shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] ${badge.className}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("footer.download")}</p>
          <div className="mt-3 grid gap-2">
            {settings.androidAppEnabled && !settings.androidAppComingSoon ? (
              <Link href={settings.androidAppUrl} target="_blank" rel="noreferrer" aria-label="Download on Google Play" className="inline-flex transition hover:opacity-90">
                <Image src="/play-store-badge.svg" alt="Download on Google Play" width={210} height={62} className="h-auto max-w-full" />
              </Link>
            ) : (
              <span className="relative inline-flex opacity-55">
                <Image src="/play-store-badge.svg" alt="Google Play coming soon" width={210} height={62} className="h-auto max-w-full" />
                <span className="absolute -right-2 -top-2 rounded-full bg-warning px-2 py-1 text-[10px] font-black uppercase text-slate-950">Coming soon</span>
              </span>
            )}
            {settings.iosAppEnabled && !settings.iosAppComingSoon ? (
              <Link href={settings.iosAppUrl} target="_blank" rel="noreferrer" aria-label="Download on the App Store" className="inline-flex transition hover:opacity-90">
                <Image src="/app-store-badge.svg" alt="Download on the App Store" width={210} height={62} className="h-auto max-w-full" />
              </Link>
            ) : (
              <span className="relative inline-flex opacity-55">
                <Image src="/app-store-badge.svg" alt="App Store coming soon" width={210} height={62} className="h-auto max-w-full" />
                <span className="absolute -right-2 -top-2 rounded-full bg-warning px-2 py-1 text-[10px] font-black uppercase text-slate-950">Coming soon</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 md:text-right">{t("footer.copy")}</p>
      </div>
    </footer>
  );
}
