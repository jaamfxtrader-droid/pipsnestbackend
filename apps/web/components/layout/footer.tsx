"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeDollarSign, CreditCard, DollarSign, Facebook, Github, Instagram, Landmark, Linkedin, Music2, Send, ShieldCheck, Twitter, Wallet, Youtube } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import { getCmsPages, type CmsPage } from "@/lib/cms";
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

const paymentIconMap = { BadgeDollarSign, CreditCard, DollarSign, Landmark, ShieldCheck, Wallet };

const socialIconMap = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  telegram: Send,
  x: Twitter,
  twitter: Twitter,
  tiktok: Music2,
  github: Github,
  discord: Send,
  whatsapp: Send
};

function colorWithAlpha(color: string, alpha: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : color;
}

export function Footer() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [cmsFooterLinks, setCmsFooterLinks] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([getSiteSettings(), getCmsPages()])
      .then(([siteSettings, pages]) => {
        if (!mounted) return;
        setSettings(siteSettings);
        setCmsFooterLinks(
          pages.filter((page) => {
            const placement = page.metadata?.navPlacement;
            return page.published !== false && (placement === "footer" || placement === "both");
          })
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const socialLinks = settings.socialItems
    .filter((social) => social.enabled && social.url)
    .map((social) => ({
      href: social.url,
      label: social.label,
      icon: socialIconMap[social.type as keyof typeof socialIconMap] ?? Send
    }));
  const staticFooterHrefs = new Set(columns.flatMap((column) => column.links.map(([, href]) => href)));
  const dynamicFooterLinks = cmsFooterLinks
    .map((page) => ({ href: page.slug === "home" ? "/" : `/${page.slug}`, label: page.metadata?.navLabel || page.title }))
    .filter((link) => !staticFooterHrefs.has(link.href));
  const showDownloadBadges = settings.androidBadgeVisible || settings.iosBadgeVisible;
  const footerText = settings.footerText || t("footer.text");
  const footerCopyright = settings.footerCopyright || t("footer.copy");

  if (loading) {
    return (
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-white/10 dark:bg-[#020817]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
          <div>
            <div className="h-10 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
            <div className="mt-4 h-20 max-w-sm animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
            <div className="mt-5 flex gap-2">
              {[0, 1, 2, 3].map((item) => <span key={item} className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />)}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[0, 1, 2].map((column) => (
              <div key={column}>
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                <div className="mt-4 grid gap-3">
                  {[0, 1, 2, 3, 4].map((row) => <div key={row} className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 px-4 pt-8 dark:border-white/10">
          <div className="h-10 max-w-xl animate-pulse rounded bg-slate-200 dark:bg-white/10" />
          <div className="mx-auto mt-8 h-4 w-72 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-white py-12 dark:border-white/10 dark:bg-[#020817]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
            {footerText}
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
                {column.title === "footer.company"
                  ? dynamicFooterLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="transition hover:text-primary">
                        {link.label}
                      </Link>
                    ))
                  : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 grid max-w-7xl gap-6 border-t border-slate-200 px-4 pt-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8 dark:border-white/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("footer.cards")}</p>
          <div className="mt-3 flex max-w-xl flex-wrap gap-2">
            {settings.paymentBadges.filter((badge) => badge.enabled && badge.label).map((badge) => {
              const Icon = paymentIconMap[badge.icon as keyof typeof paymentIconMap] ?? CreditCard;
              return (
                <span
                  key={badge.id}
                  className="inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-black uppercase tracking-wide shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                  style={{
                    borderColor: colorWithAlpha(badge.borderColor, "66"),
                    backgroundColor: colorWithAlpha(badge.backgroundColor, "1A"),
                    color: badge.textColor
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
        {showDownloadBadges ? <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("footer.download")}</p>
          <div className="mt-3 grid gap-2">
            {settings.androidBadgeVisible ? settings.androidAppEnabled && !settings.androidAppComingSoon ? (
              <Link href={settings.androidAppUrl} target="_blank" rel="noreferrer" aria-label="Download on Google Play" className="inline-flex transition hover:opacity-90">
                {settings.androidBadgeImageUrl ? (
                  <img src={settings.androidBadgeImageUrl} alt="Download on Google Play" className="h-auto max-h-[62px] max-w-[210px]" />
                ) : (
                  <Image src="/play-store-badge.svg" alt="Download on Google Play" width={210} height={62} className="h-auto max-w-full" />
                )}
              </Link>
            ) : (
              <span className="relative inline-flex opacity-55">
                {settings.androidBadgeImageUrl ? (
                  <img src={settings.androidBadgeImageUrl} alt="Google Play coming soon" className="h-auto max-h-[62px] max-w-[210px]" />
                ) : (
                  <Image src="/play-store-badge.svg" alt="Google Play coming soon" width={210} height={62} className="h-auto max-w-full" />
                )}
                <span className="absolute -right-2 -top-2 rounded-full bg-warning px-2 py-1 text-[10px] font-black uppercase text-slate-950">Coming soon</span>
              </span>
            ) : null}
            {settings.iosBadgeVisible ? settings.iosAppEnabled && !settings.iosAppComingSoon ? (
              <Link href={settings.iosAppUrl} target="_blank" rel="noreferrer" aria-label="Download on the App Store" className="inline-flex transition hover:opacity-90">
                {settings.iosBadgeImageUrl ? (
                  <img src={settings.iosBadgeImageUrl} alt="Download on the App Store" className="h-auto max-h-[62px] max-w-[210px]" />
                ) : (
                  <Image src="/app-store-badge.svg" alt="Download on the App Store" width={210} height={62} className="h-auto max-w-full" />
                )}
              </Link>
            ) : (
              <span className="relative inline-flex opacity-55">
                {settings.iosBadgeImageUrl ? (
                  <img src={settings.iosBadgeImageUrl} alt="App Store coming soon" className="h-auto max-h-[62px] max-w-[210px]" />
                ) : (
                  <Image src="/app-store-badge.svg" alt="App Store coming soon" width={210} height={62} className="h-auto max-w-full" />
                )}
                <span className="absolute -right-2 -top-2 rounded-full bg-warning px-2 py-1 text-[10px] font-black uppercase text-slate-950">Coming soon</span>
              </span>
            ) : null}
          </div>
        </div> : null}
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-200 px-4 pt-6 text-center sm:px-6 lg:px-8 dark:border-white/10">
        <p className="text-sm text-slate-500 dark:text-slate-400">{footerCopyright}</p>
      </div>
    </footer>
  );
}
