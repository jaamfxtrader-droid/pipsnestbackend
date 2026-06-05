"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BadgeDollarSign,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Clock3,
  CreditCard,
  DollarSign,
  Eye,
  Info,
  Layers3,
  LineChart,
  ListChecks,
  Lock,
  Medal,
  MonitorSmartphone,
  Repeat,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  WalletCards
} from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { apiFetch } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n";
import { getCmsPage, getCmsSection, getDefaultCmsPage, type CmsPage, type CmsSection } from "@/lib/cms";
import { defaultSiteSettings, getSiteSettings } from "@/lib/site-settings";
import { useTranslation } from "@/lib/use-translation";
import { fundingPrograms } from "@/lib/mock-data";
import { cn, currency } from "@/lib/utils";

const stats = [
  ["$125K+", "stats.payouts"],
  ["24h", "stats.review"],
  ["1:100", "stats.leverage"],
  ["80%", "stats.split"]
] as const;

const howItWorks: Array<{
  title: TranslationKey;
  text: TranslationKey;
  icon: typeof Trophy;
}> = [
  {
    title: "how.pick",
    text: "how.pickText",
    icon: Trophy
  },
  {
    title: "how.pass",
    text: "how.passText",
    icon: ShieldCheck
  },
  {
    title: "how.scale",
    text: "how.scaleText",
    icon: BarChart3
  }
];

const journey = [
  ["Step 1", "journey.step1"],
  ["Step 2", "journey.step2"],
  ["Step 3", "journey.step3"],
  ["Step 4", "journey.step4"]
] as const;

const rewards = [
  ["$42,480", "rewards.may"],
  ["$60,000", "rewards.top"],
  ["$10,044", "rewards.fastest"],
  ["$258M+", "rewards.capital"]
] as const;

type HomeJourneyMetric = {
  label: string;
  value: number;
  suffix: string;
  helper: string;
  progress: number;
};

type HomeRewardMetric = {
  label: string;
  value: number;
  kind: "currency" | "days" | "number";
  helper: string;
};

type HomeMetrics = {
  journey: HomeJourneyMetric[];
  rewards: HomeRewardMetric[];
  totals: {
    activeChallenges: number;
    totalUsers: number;
    approvedUsers: number;
    paidOrders: number;
    activeAccounts: number;
    pendingPayouts: number;
    payoutAmount: number;
    revenueAmount: number;
    topAllocation: number;
    fastestDays: number;
  };
};

const homeMetricsFallback: HomeMetrics = {
  journey: [
    { label: "Programs live", value: 3, suffix: "routes", helper: "Evaluation routes open for traders right now.", progress: 35 },
    { label: "Verified traders", value: 1, suffix: "trader", helper: "Approved profiles ready to access the trader area.", progress: 48 },
    { label: "Paid challenges", value: 1, suffix: "order", helper: "Challenge entries moving through the funding flow.", progress: 72 },
    { label: "Active accounts", value: 1, suffix: "account", helper: "Trader accounts currently active or passed.", progress: 88 }
  ],
  rewards: [
    { label: "Reward pipeline", value: 850, kind: "currency", helper: "1 pending payout request" },
    { label: "Top allocation", value: 100000, kind: "currency", helper: "Largest active challenge account size" },
    { label: "Fastest cycle", value: 5, kind: "days", helper: "Minimum trading days from live challenges" },
    { label: "Challenge volume", value: 254, kind: "currency", helper: "Successful challenge purchases" }
  ],
  totals: {
    activeChallenges: 3,
    totalUsers: 1,
    approvedUsers: 1,
    paidOrders: 1,
    activeAccounts: 1,
    pendingPayouts: 1,
    payoutAmount: 850,
    revenueAmount: 254,
    topAllocation: 100000,
    fastestDays: 5
  }
};

const featurePoints = ["feature.setup", "feature.assignment", "feature.sync", "feature.payout"] as const;

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: Math.abs(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function metricValue(metric: HomeRewardMetric) {
  if (metric.kind === "currency") return currency(metric.value);
  if (metric.kind === "days") return `${compactNumber(metric.value)} days`;
  return compactNumber(metric.value);
}

const internalPublicCopyPattern =
  /\b(admin|backend|api|cms|database|db|records?|orders table|generated from|activity updates|json-first|role-protected)\b|use this block later|founder video|testimonials|brand story|local access and convenience/i;

function publicCopy(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || internalPublicCopyPattern.test(trimmed)) return fallback;
  return trimmed;
}

function publicCta(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || /\b(api|admin|cms|backend)\b/i.test(trimmed)) return fallback;
  return trimmed;
}

function journeyMetricHelper(metric: HomeJourneyMetric) {
  const fallback: Record<string, string> = {
    "Programs live": "Evaluation routes open for traders right now.",
    "Verified traders": "Approved profiles ready to access the trader area.",
    "Paid challenges": "Challenge entries moving through the funding flow.",
    "Active accounts": "Trader accounts currently active or passed."
  };

  return publicCopy(metric.helper, fallback[metric.label] ?? "Trading progress stays visible at every stage.");
}

function rewardMetricHelper(metric: HomeRewardMetric) {
  const fallback: Record<string, string> = {
    "Reward pipeline": "Payout value currently moving through review.",
    "Top allocation": "Largest active challenge account size.",
    "Fastest cycle": "Minimum trading days available on live routes.",
    "Revenue tracked": "Successful challenge purchase volume.",
    "Challenge volume": "Successful challenge purchase volume."
  };

  return publicCopy(metric.helper, fallback[metric.label] ?? "Trading momentum updated from live platform activity.");
}

function HeroTradingVisual() {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-0 mx-auto hidden h-full max-w-7xl sm:inset-x-5 lg:block">
      <div className="absolute inset-y-4 right-0 w-[51%] overflow-visible">
        <div className="absolute -inset-x-24 top-0 bottom-12 rounded-[120px] bg-[radial-gradient(ellipse_at_62%_34%,rgba(34,211,238,0.26),rgba(37,99,235,0.14)_36%,rgba(6,17,38,0)_68%)] blur-sm [mask-image:linear-gradient(90deg,transparent_0%,black_20%,black_78%,transparent_100%)]" />
        <div className="absolute right-8 top-0 h-[440px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2),rgba(37,99,235,0.12)_42%,rgba(6,17,38,0)_70%)] blur-2xl" />
        <div className="absolute right-16 top-10 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-400/16" />
        <div className="absolute right-20 top-24 flex h-[360px] w-[420px] items-end justify-center gap-6">
          {[164, 248, 314, 226].map((height, index) => (
            <div
              key={height}
              className="animate-candle-float relative w-16 rounded-[18px] border border-blue-300/45 bg-gradient-to-b from-blue-200/70 via-blue-500/75 to-primary/90 shadow-[0_28px_55px_rgba(37,99,235,0.28)]"
              style={{ height, animationDelay: `${index * 0.18}s` }}
            >
              <span className="absolute -top-10 left-1/2 h-10 w-1 -translate-x-1/2 rounded-full bg-primary/80" />
              <span className="absolute -bottom-10 left-1/2 h-10 w-1 -translate-x-1/2 rounded-full bg-primary/40" />
              <span className="absolute inset-x-3 top-4 h-20 rounded-xl bg-white/25" />
              <span className="absolute bottom-5 left-3 right-3 h-2 rounded-full bg-white/40" />
              {index === 2 ? (
                <span className="absolute -right-8 top-10 grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary shadow-soft dark:bg-slate-900">
                  <LineChart className="h-6 w-6" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <span className="animate-float-slow absolute right-[440px] top-28 grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/65 text-primary shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="animate-float-medium absolute right-20 top-[322px] grid h-14 w-14 place-items-center rounded-2xl border border-white/70 bg-white/70 text-profit shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-green-300">
          <Target className="h-6 w-6" />
        </span>
        <span className="animate-float-slow absolute right-[360px] bottom-28 grid h-16 w-16 place-items-center rounded-2xl border border-white/70 bg-white/70 text-primary shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
          <BadgeDollarSign className="h-7 w-7" />
        </span>
        <div className="absolute bottom-20 right-4 h-36 w-[520px] rounded-full bg-cyan-300/24 blur-3xl dark:bg-primary/14" />
      </div>
    </div>
  );
}

function DashboardPreview({ section }: { section?: CmsSection }) {
  const { t } = useTranslation();
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let context: { revert: () => void } | undefined;
    let mounted = true;

    import("gsap").then(({ gsap }) => {
      if (!mounted || !previewRef.current) return;

      context = gsap.context(() => {
        gsap.fromTo(
          "[data-preview-animate]",
          { autoAlpha: 0, y: 26, scale: 0.98 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, ease: "power3.out", stagger: 0.08, delay: 0.08 }
        );
        gsap.to("[data-preview-float]", {
          y: -9,
          duration: 2.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.25
        });
        gsap.to("[data-preview-line]", {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.35
        });
        gsap.to("[data-preview-bar]", {
          scaleY: 1,
          transformOrigin: "bottom center",
          duration: 1,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.45
        });
      }, previewRef);
    });

    return () => {
      mounted = false;
      context?.revert();
    };
  }, []);

  return (
    <section ref={previewRef} className="relative z-10 -mt-16 px-3 sm:px-5">
      <div data-preview-animate className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(191,219,254,0.34),rgba(37,99,235,0.10))] p-[1px] shadow-[0_30px_110px_rgba(37,99,235,0.2)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.35),rgba(14,165,233,0.16),rgba(15,23,42,0.4))]">
        <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-white/86 p-3 backdrop-blur-2xl dark:bg-[#07152d]/92">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative grid gap-4 lg:grid-cols-[0.86fr_1.35fr] lg:gap-6">
            <div data-preview-animate className="rounded-[1.5rem] border border-slate-200/70 bg-white/72 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/10 dark:bg-white/[0.045]">
              <Badge tone="profit">{section?.eyebrow ?? t("preview.badge")}</Badge>
              <h2 className="mt-5 max-w-sm text-3xl font-semibold leading-tight text-[#061126] dark:text-white">{section?.title ?? t("preview.title")}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
                {publicCopy(section?.content, "Preview equity, accounts, progress, and payout readiness from one clean trader terminal.")}
              </p>
              <div className="mt-7 grid gap-3">
                {featurePoints.map((point, index) => (
                  <div
                    key={point}
                    data-preview-animate
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-profit" />
                      {t(point)}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-profit" style={{ opacity: 0.45 + index * 0.15 }} />
                  </div>
                ))}
              </div>
              <div data-preview-float className="mt-6 rounded-[1.35rem] border border-primary/15 bg-primary/[0.07] p-4 dark:border-primary/25 dark:bg-primary/10">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span>MT5 Sync</span>
                  <span>Live ready</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-primary/15">
                  <span data-preview-line className="block h-2 origin-left scale-x-0 rounded-full bg-primary" style={{ width: "76%" }} />
                </div>
              </div>
            </div>

            <div data-preview-animate className="relative min-h-[370px] overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-[#020817] p-3 text-white shadow-[0_28px_80px_rgba(2,8,23,0.24)] dark:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.22),transparent_30%)]" />
              <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-blue-100">Pipnest WebTrader</div>
                </div>

                <div className="grid gap-3 md:grid-cols-[170px_1fr]">
                  <aside className="hidden rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-3 md:block">
                    <div className="mb-5 flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary">
                        <LineChart className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-slate-300">Funding OS</span>
                    </div>
                    {["Overview", "Accounts", "Payouts", "Rules"].map((item, index) => (
                      <div key={item} className={index === 0 ? "mb-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white" : "mb-2 rounded-xl px-3 py-2 text-xs text-slate-500"}>
                        {item}
                      </div>
                    ))}
                    <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary to-cyan-400/70 p-3">
                      <p className="text-[11px] text-blue-100">{t("preview.balance")}</p>
                      <p className="mt-1 text-xl font-semibold">$125,721</p>
                    </div>
                  </aside>

                  <div className="rounded-[1.1rem] bg-[#f8fbff] p-4 text-slate-950">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("preview.accounts")}</p>
                        <h3 className="mt-1 text-xl font-semibold">Challenge Monitor</h3>
                      </div>
                      <Badge tone="primary">MT5</Badge>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_150px]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                          <span>{t("profit.current")}</span>
                          <span className="font-semibold text-profit">+0.47%</span>
                        </div>
                        <div className="relative h-32 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(37,99,235,0.12),rgba(37,99,235,0.02))]">
                          <div className="absolute inset-x-4 bottom-8 flex items-end gap-2">
                            {[34, 52, 44, 76, 64, 92, 86].map((height, index) => (
                              <span key={`${height}-${index}`} data-preview-bar className="block w-full origin-bottom scale-y-0 rounded-t-lg bg-gradient-to-t from-primary to-cyan-300" style={{ height }} />
                            ))}
                          </div>
                          <svg className="absolute inset-x-4 top-7 h-20 w-[calc(100%-2rem)] overflow-visible" viewBox="0 0 300 90" preserveAspectRatio="none">
                            <path d="M0 60 C38 30 62 75 100 44 C136 14 168 48 198 30 C232 10 258 24 300 12" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {[
                          ["Daily DD", "1.2%", "text-warning"],
                          ["Max DD", "4.8%", "text-primary"],
                          ["Target", "8.0%", "text-profit"]
                        ].map(([label, value, color]) => (
                          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="text-[11px] text-slate-500">{label}</p>
                            <p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {[72, 48, 86, 61].map((width, index) => (
                        <div key={width} className="grid grid-cols-[1fr_72px] items-center gap-4 text-xs">
                          <span className="h-2 rounded-full bg-slate-200">
                            <span data-preview-line className="block h-2 origin-left scale-x-0 rounded-full bg-primary" style={{ width: `${width}%` }} />
                          </span>
                          <span className="text-right text-slate-500">{t("preview.trade")} {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div data-preview-float className="absolute right-8 top-24 hidden rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl md:block">
                <p className="text-[11px] text-slate-300">Equity</p>
                <p className="text-lg font-semibold">$125.7K</p>
              </div>
              <div data-preview-float className="absolute bottom-8 left-10 hidden rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl md:block">
                <p className="text-[11px] text-slate-300">Status</p>
                <p className="text-sm font-semibold text-profit">{t("profit.active")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgramMiniCard({ program, featured = false }: { program: (typeof fundingPrograms)[number]; featured?: boolean }) {
  const { t } = useTranslation();
  const programNameKey = `program.${program.id}` as TranslationKey;

  return (
    <div className={featured ? "relative scale-105 rounded-lg bg-[#061126] p-5 text-white shadow-[0_25px_60px_rgba(6,17,38,0.28)]" : "rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"}>
      <div className="flex items-center justify-between">
        <Badge tone={featured ? "primary" : "neutral"}>{program.phase === "2-Step" ? t("program.twoStep") : program.phase}</Badge>
        <span className="text-xs text-slate-500 dark:text-slate-400">{program.leverage}</span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold">{currency(program.accountSize)}</h3>
      <p className={featured ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-500 dark:text-slate-400"}>
        {t(programNameKey)} {t("program.challenge")}
      </p>
      <div className="mt-5 grid gap-2 text-sm">
        {[
          ["program.target", `${program.profitTarget}%`],
          ["program.dailyDd", `${program.dailyDrawdown}%`],
          ["program.maxDd", `${program.maxDrawdown}%`]
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className={featured ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}>{t(label as TranslationKey)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <Button variant={featured ? "primary" : "secondary"} className="mt-5 w-full">
        {currency(program.price)}
      </Button>
    </div>
  );
}

type RankPhase = "zero" | "one" | "two";
type RankView = "cards" | "phases";

type RankProgram = {
  id: string;
  name: string;
  accountSize: number;
  price: number;
  profitTargetPercent: number;
  dailyDrawdownPercent: number;
  maxDrawdownPercent: number;
  minTradingDays: number;
  leverage: string;
  phaseCount: 0 | 1 | 2;
  featured?: boolean;
};

type ApiChallenge = {
  id: string;
  name: string;
  accountSize: number | string;
  price: number | string;
  profitTargetPercent: number | string;
  dailyDrawdownPercent: number | string;
  maxDrawdownPercent: number | string;
  minTradingDays: number | string;
  leverage: string;
  phaseCount?: number | string | null;
  sortOrder?: number | string | null;
};

const rankPhases: Array<{ key: RankPhase; label: string; count: 0 | 1 | 2; title: string }> = [
  { key: "zero", label: "Zero", count: 0, title: "Instant funded" },
  { key: "one", label: "1 Step", count: 1, title: "Single evaluation" },
  { key: "two", label: "2 Step", count: 2, title: "Two phase route" }
];

const rankCurrencies = [
  { code: "USD", label: "US", symbol: "$", rate: 1 },
  { code: "EUR", label: "EU", symbol: "EUR", rate: 0.92 },
  { code: "GBP", label: "UK", symbol: "GBP", rate: 0.78 },
  { code: "AED", label: "UAE", symbol: "AED", rate: 3.67 },
  { code: "PKR", label: "PK", symbol: "Rs", rate: 278 },
  { code: "CAD", label: "CA", symbol: "C$", rate: 1.37 }
] as const;

const rewardProfile = {
  priceMultiplier: 1,
  splitPercent: 80,
  cycle: "Biweekly"
};

const rankTierSeeds = [
  { accountSize: 5000, prices: { zero: 28, one: 32, two: 36 } },
  { accountSize: 10000, prices: { zero: 52, one: 59, two: 66 } },
  { accountSize: 25000, prices: { zero: 124, one: 139, two: 156 } },
  { accountSize: 50000, prices: { zero: 229, one: 259, two: 289 }, featured: true },
  { accountSize: 100000, prices: { zero: 419, one: 479, two: 529 } },
  { accountSize: 200000, prices: { zero: 789, one: 889, two: 989 } }
];

const rankFallbackPrograms: RankProgram[] = rankPhases.flatMap((phase) =>
  rankTierSeeds.map((tier) => ({
    id: `${phase.key}-${tier.accountSize}`,
    name: `${phase.label} ${currency(tier.accountSize)}`,
    accountSize: tier.accountSize,
    price: tier.prices[phase.key],
    profitTargetPercent: phase.key === "zero" ? 0 : phase.key === "one" ? 9 : 8,
    dailyDrawdownPercent: phase.key === "zero" ? 4 : 5,
    maxDrawdownPercent: phase.key === "zero" ? 8 : 10,
    minTradingDays: phase.key === "zero" ? 0 : 5,
    leverage: phase.key === "zero" ? "1:50" : "1:100",
    phaseCount: phase.count,
    featured: tier.featured
  }))
);

function normalizeRankChallenge(challenge: ApiChallenge): RankProgram {
  const phaseCount = Math.min(Math.max(Number(challenge.phaseCount ?? 2), 0), 2) as 0 | 1 | 2;
  const accountSize = Number(challenge.accountSize);

  return {
    id: challenge.id,
    name: challenge.name,
    accountSize,
    price: Number(challenge.price),
    profitTargetPercent: Number(challenge.profitTargetPercent),
    dailyDrawdownPercent: Number(challenge.dailyDrawdownPercent),
    maxDrawdownPercent: Number(challenge.maxDrawdownPercent),
    minTradingDays: Number(challenge.minTradingDays),
    leverage: challenge.leverage,
    phaseCount,
    featured: accountSize === 50000 || Number(challenge.sortOrder ?? 0) === 1
  };
}

function formatConvertedPrice(value: number, currencyOption: (typeof rankCurrencies)[number]) {
  const amount = Math.round(value * currencyOption.rate);
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  return currencyOption.code === "USD" ? `$${formatted}` : `${currencyOption.symbol} ${formatted}`;
}

function phaseTarget(program: RankProgram, phase: RankPhase, index: 1 | 2) {
  if (phase === "zero") return index === 1 ? "-" : "-";
  if (phase === "one") return index === 1 ? `${program.profitTargetPercent}%` : "-";
  return index === 1 ? `${program.profitTargetPercent}%` : `${Math.max(program.profitTargetPercent - 3, 5)}%`;
}

function displayProgramsForPhase(programs: RankProgram[], phase: RankPhase) {
  const phaseCount = rankPhases.find((item) => item.key === phase)?.count ?? 2;
  const directPrograms = programs.filter((program) => program.phaseCount === phaseCount);
  const fallbackPrograms = rankFallbackPrograms.filter((program) => program.phaseCount === phaseCount);
  const seenSizes = new Set(directPrograms.map((program) => program.accountSize));
  const merged = [...directPrograms, ...fallbackPrograms.filter((program) => !seenSizes.has(program.accountSize))];

  return merged.sort((left, right) => left.accountSize - right.accountSize).slice(0, 6);
}

function CurrencyPicker({
  value,
  onChange
}: {
  value: (typeof rankCurrencies)[number]["code"];
  onChange: (value: (typeof rankCurrencies)[number]["code"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = rankCurrencies.find((item) => item.code === value) ?? rankCurrencies[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-12 min-w-[10.5rem] items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#061126] shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
      >
        <span className="inline-flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
            <DollarSign className="h-4 w-4" />
          </span>
          {selected.label} {selected.code}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute left-0 top-14 z-40 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-[0_22px_60px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#0b172d]">
          {rankCurrencies.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                onChange(item.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition",
                item.code === selected.code
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#061126] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              )}
            >
              <span>{item.label} {item.code}</span>
              <span className={item.code === selected.code ? "text-blue-100" : "text-slate-400"}>{item.symbol}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RankProgramCard({
  program,
  currencyOption,
  phase,
  featured,
  onSelect
}: {
  program: RankProgram;
  currencyOption: (typeof rankCurrencies)[number];
  phase: RankPhase;
  featured: boolean;
  onSelect: () => void;
}) {
  const adjustedPrice = program.price * rewardProfile.priceMultiplier;
  const rewardEstimate = Math.round(program.accountSize * (rewardProfile.splitPercent / 100) * 0.0574);

  return (
    <article
      className={cn(
        "relative flex min-h-[26rem] flex-col rounded-lg border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]",
        featured
          ? "border-[#082f73] bg-[#082f73] text-white shadow-[0_30px_80px_rgba(8,47,115,0.28)]"
          : "border-slate-200 bg-white text-[#061126] dark:border-white/10 dark:bg-[#10203b] dark:text-white"
      )}
    >
      {featured ? (
        <span className="absolute left-1/2 top-0 inline-flex h-8 -translate-x-1/2 -translate-y-1/2 items-center rounded-md bg-[#3b6db7] px-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
          Most picked
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>Account size</p>
          <h3 className="mt-2 text-3xl font-semibold">{currency(program.accountSize)}</h3>
        </div>
        <div className="text-right">
          <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>Price</p>
          <p className="mt-2 text-2xl font-semibold">{formatConvertedPrice(adjustedPrice, currencyOption)}</p>
        </div>
      </div>

      <AuthAwareLink href={`/dashboard/purchase?challenge=${program.id}`} authenticatedHref={`/dashboard/purchase?challenge=${program.id}`}>
        <Button variant={featured ? "secondary" : "primary"} className="mt-5 w-full rounded-md">
          Buy Challenge
        </Button>
      </AuthAwareLink>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "mt-4 grid gap-3 rounded-md p-4 text-left transition",
          featured ? "bg-white/12 hover:bg-white/16" : "bg-slate-100 hover:bg-slate-200/70 dark:bg-[#0a172c] dark:text-slate-100 dark:hover:bg-[#0f2340]"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-semibold">
            Profit Target <Info className="h-3.5 w-3.5 opacity-55" />
          </span>
          <span className="text-xs font-semibold opacity-70">{program.leverage}</span>
        </div>
        <div className={cn("grid gap-2 border-b pb-3 text-sm", featured ? "border-white/14" : "border-slate-200 dark:border-white/10")}>
          <span className="flex justify-between gap-3">
            <span className={featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}>Phase 1</span>
            <strong>{phaseTarget(program, phase, 1)}</strong>
          </span>
          <span className="flex justify-between gap-3">
            <span className={featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}>Phase 2</span>
            <strong>{phaseTarget(program, phase, 2)}</strong>
          </span>
          <span className="flex justify-between gap-3">
            <span className={featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}>Master</span>
            <strong>{phase === "zero" ? "Live" : "-"}</strong>
          </span>
        </div>
        <span className="flex justify-between text-sm">
          <span>Max Loss</span>
          <strong>{program.maxDrawdownPercent}%</strong>
        </span>
        <span className="flex justify-between text-sm">
          <span>Daily Loss</span>
          <strong>{program.dailyDrawdownPercent}%</strong>
        </span>
        <span className="flex justify-between text-sm">
          <span>Split</span>
          <strong>{rewardProfile.cycle} - {rewardProfile.splitPercent}%</strong>
        </span>
      </button>

      <p className={cn("mt-auto pt-5 text-center text-sm", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
        Traders earn <strong className={featured ? "text-white" : "text-[#061126] dark:text-white"}>{formatConvertedPrice(rewardEstimate, currencyOption)}</strong> avg first rewards
      </p>
    </article>
  );
}

function RankPhaseBoard({
  program,
  phase,
  currencyOption
}: {
  program: RankProgram;
  phase: RankPhase;
  currencyOption: (typeof rankCurrencies)[number];
}) {
  const adjustedPrice = program.price * rewardProfile.priceMultiplier;
  const phaseSteps = phase === "zero" ? ["Funded"] : phase === "one" ? ["Evaluation", "Master"] : ["Phase 1", "Phase 2", "Master"];

  return (
    <div className="mt-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid lg:grid-cols-[16rem_1fr_18rem]">
        <div className="grid content-end gap-8 border-b border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] lg:border-b-0 lg:border-r">
          <span className="inline-flex items-center gap-2"><Target className="h-4 w-4" /> Profit Target</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Max Loss</span>
          <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Daily Drawdown</span>
        </div>

        <div className="p-6 lg:p-8">
          <div className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Evaluation Stage</div>
          <div className="mt-5 grid gap-5" style={{ gridTemplateColumns: `repeat(${phaseSteps.length}, minmax(0, 1fr))` }}>
            {phaseSteps.map((step, index) => (
              <div key={step} className="relative grid justify-items-center gap-4">
                {index > 0 ? <span className="absolute right-1/2 top-9 h-[2px] w-full bg-slate-200 dark:bg-white/10" /> : null}
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-slate-200 text-xl font-semibold text-[#061126] dark:bg-white/10 dark:text-white">
                  {step === "Master" || step === "Funded" ? <Crown className="h-6 w-6 text-warning" /> : index + 1}
                </span>
                <h3 className="text-xl font-semibold text-[#061126] dark:text-white">{step}</h3>
                <div className="grid gap-8 text-center text-lg font-semibold text-[#061126] dark:text-white">
                  <span>{step === "Phase 2" ? phaseTarget(program, phase, 2) : step === "Master" || step === "Funded" ? "-" : phaseTarget(program, phase, 1)}</span>
                  <span>{program.maxDrawdownPercent}%</span>
                  <span>{program.dailyDrawdownPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0b459f] p-6 text-white lg:p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Funded</h3>
            <Crown className="h-7 w-7 text-warning" />
          </div>
          <div className="mt-10 grid gap-8 text-lg font-semibold">
            <span>{phase === "zero" ? "Live" : "-"}</span>
            <span>{program.maxDrawdownPercent}%</span>
            <span>{program.dailyDrawdownPercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 border-t border-slate-200 p-5 dark:border-white/10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-lg font-semibold text-[#061126] dark:text-white">
            <Repeat className="h-5 w-5 text-primary" /> Reward cycles
          </span>
          {["Weekly - 60%", `${rewardProfile.cycle} - ${rewardProfile.splitPercent}%`, "Monthly - 100%", "Scaling - 90%"].map((cycle) => (
            <span key={cycle} className={cn("rounded-md px-3 py-2 text-sm font-semibold", cycle.includes(rewardProfile.cycle) ? "bg-[#082f73] text-white" : "bg-slate-100 text-[#061126] dark:bg-white/10 dark:text-white")}>
              {cycle}
            </span>
          ))}
        </div>
        <div className="grid gap-2 rounded-md bg-slate-50 p-4 dark:bg-white/8 sm:grid-cols-3 sm:items-end">
          <span>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Account size</span>
            <strong className="text-2xl text-[#061126] dark:text-white">{currency(program.accountSize)}</strong>
          </span>
          <span>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Price</span>
            <strong className="text-2xl text-[#061126] dark:text-white">{formatConvertedPrice(adjustedPrice, currencyOption)}</strong>
          </span>
          <AuthAwareLink href={`/dashboard/purchase?challenge=${program.id}`} authenticatedHref={`/dashboard/purchase?challenge=${program.id}`}>
            <Button className="w-full rounded-md">Buy Challenge</Button>
          </AuthAwareLink>
        </div>
      </div>
    </div>
  );
}

function RankUpShowcase({ section, programs }: { section?: CmsSection; programs: RankProgram[] }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<RankPhase>("two");
  const [currencyCode, setCurrencyCode] = useState<(typeof rankCurrencies)[number]["code"]>("USD");
  const [view, setView] = useState<RankView>("cards");
  const [cardStart, setCardStart] = useState(0);
  const visiblePrograms = useMemo(() => displayProgramsForPhase(programs, phase), [programs, phase]);
  const maxCardStart = Math.max(0, visiblePrograms.length - 4);
  const carouselPrograms = visiblePrograms.slice(cardStart, cardStart + 4);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(visiblePrograms[3]?.id ?? visiblePrograms[0]?.id ?? "two-50000");
  const currencyOption = rankCurrencies.find((item) => item.code === currencyCode) ?? rankCurrencies[0];
  const selectedProgram = visiblePrograms.find((program) => program.id === selectedProgramId) ?? visiblePrograms[0] ?? rankFallbackPrograms[0];

  useEffect(() => {
    setCardStart(0);
  }, [phase, programs]);

  useEffect(() => {
    setCardStart((current) => Math.min(current, maxCardStart));
  }, [maxCardStart]);

  useEffect(() => {
    if (!visiblePrograms.some((program) => program.id === selectedProgramId)) {
      setSelectedProgramId(visiblePrograms[3]?.id ?? visiblePrograms[0]?.id ?? "two-50000");
    }
  }, [selectedProgramId, visiblePrograms]);

  return (
    <section className="bg-[#f7fbff] py-20 dark:bg-[#081936]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">{section?.eyebrow ?? t("rank.label")}</p>
          <h2 className="mt-3 text-4xl font-semibold text-[#061126] dark:text-white">{section?.title ?? "Buckle Up, Your Journey Starts Here!"}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {section?.content ?? "Choose Zero, 1 Step, or 2 Step routes, then compare live pricing from the challenge data."}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="justify-self-start">
            <CurrencyPicker value={currencyCode} onChange={setCurrencyCode} />
          </div>

          <div className="grid justify-items-center gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              {rankPhases.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPhase(item.key)}
                  className={cn("h-10 rounded-md px-5 text-sm font-semibold transition", phase === item.key ? "bg-[#082f73] text-white shadow-sm" : "text-slate-500 hover:text-primary dark:text-slate-300")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="justify-self-end">
            <button
              type="button"
              onClick={() => setView(view === "cards" ? "phases" : "cards")}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#061126] shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            >
              {view === "cards" ? <Eye className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}
              {view === "cards" ? "Phases" : "Cards"}
            </button>
          </div>
        </div>

        {view === "phases" ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {visiblePrograms.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => setSelectedProgramId(program.id)}
                className={cn("rounded-md px-4 py-2 text-sm font-semibold transition", selectedProgram.id === program.id ? "bg-[#082f73] text-white shadow-sm" : "bg-white text-slate-500 hover:text-primary dark:bg-white/[0.06] dark:text-slate-300")}
              >
                {currency(program.accountSize)}
              </button>
            ))}
          </div>
        ) : null}

        {view === "cards" ? (
          <div className="mt-12">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Showing {cardStart + 1}-{Math.min(cardStart + 4, visiblePrograms.length)} of {visiblePrograms.length}
              </div>
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={() => setCardStart((current) => Math.max(0, current - 1))}
                  disabled={cardStart === 0}
                  className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-[#061126] transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  aria-label="Previous challenge cards"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCardStart((current) => Math.min(maxCardStart, current + 1))}
                  disabled={cardStart >= maxCardStart}
                  className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-[#061126] transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  aria-label="Next challenge cards"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {carouselPrograms.map((program) => (
                <RankProgramCard
                  key={program.id}
                  program={program}
                  phase={phase}
                  currencyOption={currencyOption}
                  featured={selectedProgram.id === program.id}
                  onSelect={() => setSelectedProgramId(program.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <RankPhaseBoard program={selectedProgram} phase={phase} currencyOption={currencyOption} />
        )}

        <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 md:grid-cols-3">
          <span className="inline-flex items-center gap-2"><Route className="h-4 w-4 text-primary" /> {rankPhases.find((item) => item.key === phase)?.title}</span>
          <span className="inline-flex items-center gap-2"><Layers3 className="h-4 w-4 text-primary" /> Balanced rules with strong first rewards.</span>
          <span className="inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Pricing, phase rules, and account sizes stay aligned across every route.</span>
        </div>
      </div>
    </section>
  );
}

function TraderJourneySection({ section, metrics }: { section?: CmsSection; metrics: HomeMetrics }) {
  return (
    <section className="bg-white py-20 dark:bg-[#061126]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">{section?.eyebrow ?? "Trader's Journey"}</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold text-[#061126] dark:text-white">
              {section?.title ?? "Track each milestone from challenge to payout"}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {publicCopy(section?.content, "Move from evaluation to funded status with milestone cards, payout readiness, and account progress in view.")}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#061126,#0b3b86)] p-5 text-white shadow-[0_24px_70px_rgba(37,99,235,0.24)] dark:border-white/10">
            <div className="flex items-center justify-between gap-4">
              <Badge tone="profit">Live progress</Badge>
              <span className="text-sm font-semibold text-blue-100">{metrics.totals.pendingPayouts} payouts in review</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Active accounts</p>
                <p className="mt-2 text-4xl font-semibold">{compactNumber(metrics.totals.activeAccounts)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Approved traders</p>
                <p className="mt-2 text-4xl font-semibold">{compactNumber(metrics.totals.approvedUsers)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.journey.map((item, index) => {
            const Icon = [Trophy, ShieldCheck, CreditCard, LineChart][index % 4];

            return (
              <article
                key={item.label}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-[#f8fbff] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(37,99,235,0.14)] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="absolute right-4 top-4 text-6xl font-semibold text-primary/[0.07] dark:text-white/[0.05]">0{index + 1}</div>
                <div className="relative flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge tone={index === 3 ? "profit" : "primary"}>{item.suffix}</Badge>
                </div>
                <h3 className="relative mt-6 text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</h3>
                <p className="mt-2 text-3xl font-semibold text-[#061126] dark:text-white">{compactNumber(item.value)}</p>
                <p className="mt-3 min-h-[3rem] text-sm leading-6 text-slate-600 dark:text-slate-400">{journeyMetricHelper(item)}</p>
                <div className="mt-5 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                  <span className="block h-2 rounded-full bg-primary transition-all group-hover:bg-profit" style={{ width: `${Math.min(Math.max(item.progress, 8), 100)}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RealRewardsSection({ section, metrics }: { section?: CmsSection; metrics: HomeMetrics }) {
  const rewardIcons = [BadgeDollarSign, Trophy, Clock3, BarChart3];

  return (
    <section className="bg-[#f7fbff] py-16 dark:bg-[#081936]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">{section?.eyebrow ?? "Live rewards"}</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#061126] dark:text-white">{section?.title ?? "Real traders, real rewards, real impact"}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {publicCopy(section?.content, "Reward, allocation, cycle, and purchase figures reflect real platform momentum without hiding the rules.")}
            </p>
          </div>
          <Badge tone="primary">Trading pulse</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.rewards.map((item, index) => {
            const Icon = rewardIcons[index % rewardIcons.length];

            return (
              <article key={item.label} className="relative overflow-hidden rounded-lg bg-[#061126] p-5 text-white shadow-soft">
                <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.38),transparent_40%),linear-gradient(135deg,rgba(37,99,235,0.95),rgba(14,165,233,0.35))]" />
                <div className="relative">
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-white/12 text-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-10 text-3xl font-semibold">{metricValue(item)}</p>
                  <h3 className="mt-2 font-semibold text-blue-100">{item.label}</h3>
                  <p className="mt-3 min-h-[3rem] text-sm leading-6 text-slate-300">{rewardMetricHelper(item)}</p>
                  <div className="mt-5 flex items-center gap-1 text-amber-300">
                    {Array.from({ length: Math.min(index + 2, 5) }).map((_, starIndex) => (
                      <Star key={starIndex} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TradeOrbitSection({ section }: { section?: CmsSection }) {
  const { t } = useTranslation();
  const orbitItems = [
    { label: "MT4 Bridge", detail: "Account provisioning ready for MT4 workflows.", Icon: MonitorSmartphone, tone: "bg-primary", x: "50%", y: "4%" },
    { label: "MT5 Ready", detail: "Account progress and trading stats stay easy to review.", Icon: LineChart, tone: "bg-cyan-500", x: "79%", y: "15%" },
    { label: "Payouts", detail: "Trader payout requests stay visible from review to release.", Icon: BadgeDollarSign, tone: "bg-profit", x: "96%", y: "48%" },
    { label: "Coupons", detail: "Discount codes apply cleanly during checkout.", Icon: CreditCard, tone: "bg-red-500", x: "82%", y: "82%" },
    { label: "Risk Rules", detail: "Targets, drawdowns, and status checks stay visible.", Icon: ShieldCheck, tone: "bg-warning", x: "50%", y: "96%" },
    { label: "Affiliate", detail: "Referral tracking and commissions are built in.", Icon: WalletCards, tone: "bg-emerald-500", x: "18%", y: "82%" },
    { label: "Mobile view", detail: "Trader screens stay clear on desktop and phone.", Icon: MonitorSmartphone, tone: "bg-indigo-500", x: "4%", y: "48%" },
    { label: "Analytics", detail: "Progress, balances, and challenge stats stay synced.", Icon: Target, tone: "bg-blue-600", x: "21%", y: "15%" }
  ];

  return (
    <section className="bg-white py-20 dark:bg-[#061126]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-primary">{section?.eyebrow ?? t("trade.label")}</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-[#061126] dark:text-white">
            {section?.title ?? t("trade.title")}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            {section?.content ?? "Connect platforms, coupons, affiliates, payout controls, and risk visibility inside one operational flow."}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 text-sm">
            {[
              ["MT4 Ready", MonitorSmartphone],
              ["MT5 Ready", LineChart],
              ["Rules visible", ShieldCheck],
              ["Affiliate synced", WalletCards]
            ].map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-profit/10 text-profit">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-semibold text-[#061126] dark:text-white">{label as string}</span>
              </div>
            ))}
          </div>

          <AuthAwareLink href={section?.ctaHref ?? "/auth/login"} authenticatedHref="/dashboard">
            <Button className="mt-8">{section?.ctaLabel ?? t("trade.button")}</Button>
          </AuthAwareLink>
        </div>

        <div className="group/orbit relative mx-auto aspect-square w-full max-w-[38rem]">
          <div className="absolute inset-6 rounded-full border border-slate-200 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_55%)] shadow-[inset_0_0_60px_rgba(37,99,235,0.08)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.16),transparent_60%)]" />
          <div className="absolute inset-20 rounded-full border border-primary/15 dark:border-primary/25" />

          <div className="absolute left-1/2 top-1/2 z-10 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white p-[2px] shadow-[0_24px_70px_rgba(37,99,235,0.18)] dark:bg-slate-950">
            <div className="animate-glow-ring absolute inset-[-3px] rounded-full bg-[conic-gradient(from_90deg,#2563eb,#22d3ee,#22c55e,#2563eb)] opacity-80 blur-[1px]" />
            <div className="relative grid h-full w-full place-items-center rounded-full bg-white text-center text-sm font-semibold text-[#061126] dark:bg-[#101827] dark:text-white">
              <span className="max-w-[7rem] leading-6">{t("trade.center")}</span>
            </div>
          </div>

          <div className="absolute inset-0 animate-orbit-slow">
            {orbitItems.map((item) => (
              <div key={item.label} className="absolute" style={{ left: item.x, top: item.y, transform: "translate(-50%, -50%)" }}>
                <div className="animate-orbit-reverse group/icon relative">
                  <button
                    type="button"
                    className={cn(
                      "grid h-16 w-16 place-items-center rounded-lg text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] transition duration-300 group-hover/icon:scale-110 dark:shadow-[0_18px_42px_rgba(0,0,0,0.28)]",
                      item.tone
                    )}
                    aria-label={item.label}
                  >
                    <item.Icon className="h-7 w-7" />
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-[4.75rem] z-30 w-56 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-left text-xs text-slate-600 opacity-0 shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition duration-300 group-hover/icon:translate-y-1 group-hover/icon:opacity-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                    <strong className="block text-sm text-[#061126] dark:text-white">{item.label}</strong>
                    <span className="mt-1 block leading-5">{item.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CapitalEngineSection({ section, metrics }: { section?: CmsSection; metrics: HomeMetrics }) {
  const { t } = useTranslation();
  const capitalCards = [
    { title: "Challenge capital", value: currency(metrics.totals.topAllocation), helper: "Largest active funded route", Icon: Target },
    { title: "Reward pipeline", value: currency(metrics.totals.payoutAmount), helper: "Payout value under review", Icon: BadgeDollarSign },
    { title: "Secure workflows", value: `${compactNumber(metrics.totals.activeChallenges)} routes`, helper: "Published challenge routes", Icon: Lock }
  ];

  return (
    <section className="bg-[#f7fbff] py-20 dark:bg-[#081936]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.12)] dark:border-white/10 dark:bg-[#07152d]">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-6 md:p-8 lg:p-10">
              <p className="text-sm font-semibold text-primary">{section?.eyebrow ?? t("capital.label")}</p>
              <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-[#061126] dark:text-white">
                {section?.title ?? t("capital.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                {section?.content ?? "A compact command layer for challenge cards, payout confidence, and secure trader workflows."}
              </p>

              <div className="mt-8 grid gap-3">
                {capitalCards.map((item) => (
                  <div key={item.title} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
                      <item.Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400">{item.title}</span>
                      <strong className="block text-xl text-[#061126] dark:text-white">{item.value}</strong>
                    </span>
                    <span className="hidden text-right text-xs leading-5 text-slate-500 dark:text-slate-400 sm:block">{item.helper}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[28rem] overflow-hidden bg-[#061126] p-6 text-white md:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.3),transparent_32%)]" />
              <div className="animate-capital-scan absolute top-20 h-36 w-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="relative grid h-full content-between gap-8">
                <div>
                  <Badge tone="profit">Capital engine</Badge>
                  <h3 className="mt-5 max-w-sm text-3xl font-semibold leading-tight">Evaluate skill. Assign capital. Track every rule.</h3>
                </div>

                <div className="grid gap-4">
                  {[
                    ["Evaluation", `${metrics.totals.activeChallenges} live routes`, "w-[62%]"],
                    ["Backing", currency(metrics.totals.topAllocation), "w-[82%]"],
                    ["Payout trust", currency(metrics.totals.payoutAmount), "w-[48%]"]
                  ].map(([label, value, width]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-semibold text-blue-100">{label}</span>
                        <strong>{value}</strong>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <span className={cn("block h-2 rounded-full bg-gradient-to-r from-primary to-cyan-300", width as string)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryMissionSection({ section, metrics }: { section?: CmsSection; metrics: HomeMetrics }) {
  const title = publicCopy(section?.title, "Built by traders, for traders. Your growth is our mission.");
  const content = publicCopy(
    section?.content,
    "Pipnest is designed around disciplined trading: clear rules, transparent milestones, and a growth path that rewards consistency."
  );
  const pillars = [
    { label: "Clear evaluation", text: "Profit targets and drawdown limits stay easy to read.", Icon: Target },
    { label: "Trader support", text: "Support, payout, and account steps are kept close.", Icon: ShieldCheck },
    { label: "Scale with proof", text: "Progress is measured before capital increases.", Icon: LineChart }
  ];
  const missionStats = [
    { label: "Live routes", value: compactNumber(metrics.totals.activeChallenges), Icon: Route },
    { label: "Top allocation", value: currency(metrics.totals.topAllocation), Icon: BadgeDollarSign },
    { label: "Fastest cycle", value: `${compactNumber(metrics.totals.fastestDays)} days`, Icon: Clock3 }
  ];

  return (
    <section className="overflow-hidden bg-white py-20 dark:bg-[#061126]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <Badge tone="primary">Trader-first mission</Badge>
          <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-[#061126] dark:text-white">{title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">{content}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {pillars.map((item) => (
              <article key={item.label} className="rounded-lg border border-slate-200 bg-[#f8fbff] p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">
                  <item.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-[#061126] dark:text-white">{item.label}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden rounded-lg bg-[#071c3b] p-6 text-white shadow-[0_28px_90px_rgba(37,99,235,0.18)] dark:bg-[#020817] md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(34,211,238,0.08)),radial-gradient(circle_at_72%_20%,rgba(34,197,94,0.22),transparent_28%)]" />
          <div className="absolute -right-16 top-10 h-56 w-56 rounded-full border border-cyan-300/20" />
          <div className="absolute bottom-8 left-8 h-36 w-36 rounded-full border border-primary/30" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo tone="light" compact />
              <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">Mission desk</span>
            </div>

            <div className="max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">What we protect</p>
              <h3 className="mt-4 text-3xl font-semibold leading-tight">A fair path from first challenge to funded confidence.</h3>
              <div className="mt-6 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {missionStats.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <item.Icon className="h-5 w-5 text-cyan-200" />
                  <p className="mt-4 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-blue-100">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TraderDashboardSection({ section, metrics }: { section?: CmsSection; metrics: HomeMetrics }) {
  const title = publicCopy(section?.title, "A trader workspace that keeps every rule visible.");
  const content = publicCopy(
    section?.content,
    "Track challenge progress, trading accounts, payout steps, and support from one clean dashboard built for daily use."
  );
  const ctaLabel = publicCta(section?.ctaLabel, "Explore Dashboard");
  const progress = Math.min(96, Math.max(32, metrics.totals.activeAccounts > 0 ? 76 : 42));
  const dashboardRows = [
    { label: "Challenge Progress", value: `${progress}%`, Icon: Trophy },
    { label: "Trading Accounts", value: compactNumber(metrics.totals.activeAccounts), Icon: LineChart },
    { label: "Payout Requests", value: compactNumber(metrics.totals.pendingPayouts), Icon: BadgeDollarSign },
    { label: "Support Status", value: "Ready", Icon: ShieldCheck }
  ];

  return (
    <section className="bg-[#f7fbff] py-20 dark:bg-[#081936]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div>
          <Badge tone="primary">{section?.eyebrow ?? "Trader dashboard"}</Badge>
          <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-[#061126] dark:text-white">{title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">{content}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Live accounts", compactNumber(metrics.totals.activeAccounts)],
              ["Payout reviews", compactNumber(metrics.totals.pendingPayouts)],
              ["Routes open", compactNumber(metrics.totals.activeChallenges)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-2xl font-semibold text-[#061126] dark:text-white">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <AuthAwareLink href={section?.ctaHref ?? "/auth/login"} authenticatedHref="/dashboard">
            <Button className="mt-8">{ctaLabel}</Button>
          </AuthAwareLink>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-[#020817] p-5 text-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.35),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(34,197,94,0.14),transparent_26%)]" />
          <div className="animate-capital-scan absolute top-16 h-32 w-1/2 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-center justify-between gap-4">
              <BrandLogo compact tone="light" />
              <Badge tone="profit">Live trading view</Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-blue-100">Current evaluation</p>
                    <h3 className="mt-2 text-2xl font-semibold">Phase 1 progress</h3>
                  </div>
                  <span className="rounded-md bg-profit/15 px-3 py-1 text-xs font-semibold text-profit">On track</span>
                </div>
                <div className="mt-8">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Target path</span>
                    <strong>{progress}%</strong>
                  </div>
                  <ProgressBar value={progress} className="bg-white/10" />
                </div>
                <div className="mt-8 grid grid-cols-8 items-end gap-2">
                  {[42, 58, 48, 66, 74, 61, 82, 76].map((height, index) => (
                    <span
                      key={index}
                      className="rounded-t-md bg-gradient-to-t from-primary to-cyan-300"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {dashboardRows.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-white/10 text-blue-100">
                        <item.Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-slate-200">{item.label}</span>
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {["Rules visible", "Fast review", "Payout clarity"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-blue-100">
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-profit" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MeetTraderSection({ section, metrics, androidAppUrl }: { section?: CmsSection; metrics: HomeMetrics; androidAppUrl: string }) {
  const title = publicCopy(section?.title, "Meet the trader area that moves with you.");
  const content = publicCopy(
    section?.content,
    "Keep account status, equity, challenge rules, payout steps, and support close whether you are checking in from desktop or phone."
  );
  const ctaLabel = publicCta(section?.ctaLabel, "Create trader profile");
  const allocation = metrics.totals.topAllocation > 0 ? metrics.totals.topAllocation : 100000;
  const progress = Math.min(92, Math.max(28, metrics.totals.approvedUsers > 0 ? 68 : 36));

  return (
    <section className="overflow-hidden bg-white py-20 dark:bg-[#061126]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="relative min-h-[34rem]">
          <div className="absolute left-4 top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
          <div className="absolute bottom-6 right-0 h-56 w-56 rounded-full bg-profit/10 blur-3xl" />

          <div className="relative mx-auto w-[20rem] rounded-[2rem] border-[10px] border-slate-950 bg-slate-950 p-3 shadow-[0_32px_90px_rgba(37,99,235,0.28)]">
            <div className="overflow-hidden rounded-[1.35rem] bg-[#081936] text-white">
              <div className="bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.5),transparent_48%)] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-100">Pipnest Trader</span>
                  <span className="rounded-full bg-profit/15 px-2.5 py-1 text-[10px] font-semibold text-profit">Verified</span>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-lg font-bold text-primary">TR</span>
                  <div>
                    <p className="text-sm font-semibold">Trader account</p>
                    <p className="text-xs text-slate-300">Rules, equity, and payouts in view</p>
                  </div>
                </div>
                <p className="mt-7 text-xs text-slate-400">Allocation view</p>
                <p className="mt-1 text-3xl font-semibold">{currency(allocation)}</p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-300">
                    <span>Evaluation progress</span>
                    <span>{progress}%</span>
                  </div>
                  <ProgressBar value={progress} className="bg-white/10" />
                </div>
              </div>

              <div className="grid gap-3 p-5">
                {[
                  ["Daily loss", "Protected", ShieldCheck],
                  ["Payout status", `${compactNumber(metrics.totals.pendingPayouts)} review`, BadgeDollarSign],
                  ["Support", "Online", CheckCircle2]
                ].map(([label, value, Icon]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-lg bg-white/[0.06] p-3">
                    <span className="flex items-center gap-2 text-sm text-slate-200">
                      <Icon className="h-4 w-4 text-blue-200" />
                      {label as string}
                    </span>
                    <strong className="text-sm">{value as string}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute left-0 top-16 hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#0b1833] sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Rule check</p>
            <p className="mt-2 text-lg font-semibold text-[#061126] dark:text-white">Drawdown clear</p>
          </div>
          <div className="absolute bottom-14 right-0 hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#0b1833] sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Next action</p>
            <p className="mt-2 text-lg font-semibold text-[#061126] dark:text-white">Request review</p>
          </div>
        </div>

        <div>
          <Badge tone="profit">{section?.eyebrow ?? "Meet Trader"}</Badge>
          <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-[#061126] dark:text-white">{title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">{content}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Equity snapshot", LineChart],
              ["Payout timeline", BadgeDollarSign],
              ["Rule alerts", ShieldCheck],
              ["Profile security", Lock]
            ].map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-[#f8fbff] p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-[#061126] dark:text-white">{label as string}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AuthAwareLink href={section?.ctaHref ?? "/auth/register"} authenticatedHref="/dashboard">
              <Button>{ctaLabel}</Button>
            </AuthAwareLink>
            <a
              href={androidAppUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-full transition hover:opacity-90"
              aria-label="Download on Google Play"
            >
              <Image src="/play-store-badge.svg" alt="Download on Google Play" width={148} height={44} className="h-10 w-auto" />
            </a>
            <PwaInstallButton label="Install app" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-[188px] rounded-[32px] border-[10px] border-slate-950 bg-slate-950 p-3 shadow-[0_24px_70px_rgba(37,99,235,0.28)] dark:border-black">
      <div className="rounded-[22px] bg-[#081936] p-4 text-white">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Pipnest</span>
          <span className="h-2 w-2 rounded-full bg-profit" />
        </div>
        <p className="text-xs text-slate-400">{t("mobile.equity")}</p>
        <p className="mt-1 text-2xl font-semibold">$47.77K</p>
        <div className="mt-5 h-24 rounded-lg bg-gradient-to-br from-primary/60 to-cyan-300/30" />
        <Button className="mt-5 h-9 w-full">{t("mobile.sync")}</Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const [homePage, setHomePage] = useState<CmsPage | undefined>(() => getDefaultCmsPage("home"));
  const [rankPrograms, setRankPrograms] = useState<RankProgram[]>(rankFallbackPrograms);
  const [homeMetrics, setHomeMetrics] = useState<HomeMetrics>(homeMetricsFallback);
  const [androidAppUrl, setAndroidAppUrl] = useState(defaultSiteSettings.androidAppUrl);

  useEffect(() => {
    let mounted = true;

    getCmsPage("home").then((page) => {
      if (mounted) setHomePage(page);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    getSiteSettings().then((siteSettings) => {
      if (mounted) setAndroidAppUrl(siteSettings.androidAppUrl);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    apiFetch<HomeMetrics>("/cms/home-metrics")
      .then((data) => {
        if (mounted) setHomeMetrics(data);
      })
      .catch(() => {
        if (mounted) setHomeMetrics(homeMetricsFallback);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    apiFetch<{ challenges: ApiChallenge[] }>("/challenges")
      .then((data) => {
        if (!mounted || data.challenges.length === 0) return;
        setRankPrograms(data.challenges.map(normalizeRankChallenge));
      })
      .catch(() => {
        if (mounted) setRankPrograms(rankFallbackPrograms);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = homePage?.title ?? t("hero.title");
  const heroSubtitle = homePage?.content ?? t("hero.subtitle");
  const heroSection = getCmsSection(homePage, "hero");
  const previewSection = getCmsSection(homePage, "preview");
  const howSection = getCmsSection(homePage, "how");
  const rankSection = getCmsSection(homePage, "rank");
  const journeySection = getCmsSection(homePage, "journey");
  const rewardsSection = getCmsSection(homePage, "rewards");
  const tradeSection = getCmsSection(homePage, "trade");
  const capitalSection = getCmsSection(homePage, "capital");
  const storySection = getCmsSection(homePage, "story");
  const dashboardSection = getCmsSection(homePage, "dashboard");
  const mobileSection = getCmsSection(homePage, "mobile");
  const finalSection = getCmsSection(homePage, "final");

  return (
    <main className="-mt-20 overflow-hidden">
      <section className="relative min-h-[800px] bg-[#f4fbff] px-3 pb-24 pt-[6.25rem] dark:bg-[#061126] sm:px-5 lg:pt-28">
        <div className="absolute inset-x-0 top-0 h-[540px] bg-[linear-gradient(180deg,#ffffff_0%,#e9fbff_70%,rgba(233,251,255,0)_100%)] dark:bg-[linear-gradient(180deg,#081936_0%,#08233f_60%,rgba(6,17,38,0)_100%)]" />
        <HeroTradingVisual />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl pt-10">
            <Badge tone="primary">{heroSection?.eyebrow ?? t("hero.badge")}</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#061126] sm:text-6xl dark:text-white">
              {heroSection?.title ?? heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {heroSection?.content ?? heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <AuthAwareLink href={heroSection?.ctaHref ?? "/auth/register"} authenticatedHref="/dashboard">
                <Button className="px-5">
                  {heroSection?.ctaLabel ?? t("hero.primary")} <ArrowRight className="h-4 w-4" />
                </Button>
              </AuthAwareLink>
              <Link href="/challenge-details">
                <Button variant="secondary">{t("hero.secondary")}</Button>
              </Link>
            </div>
          </div>
          <div className="mt-14 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xl font-semibold text-[#061126] dark:text-white">{value}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t(label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DashboardPreview section={previewSection} />

      <section className="bg-white py-20 dark:bg-[#061126]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">{howSection?.eyebrow ?? t("home.howLabel")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{howSection?.title ?? t("home.howTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Select a route, trade through the rules, and unlock a funded account from one clean dashboard.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f3f8ff)] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(37,99,235,0.14)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
              >
                <div className="absolute right-4 top-4 text-6xl font-semibold text-primary/[0.07] dark:text-white/[0.05]">0{index + 1}</div>
                <div className="relative flex items-start justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-white shadow-[0_16px_35px_rgba(37,99,235,0.25)] transition group-hover:scale-105">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-[#061126] dark:bg-white/10 dark:text-white">
                    {index === 0 ? "Choose" : index === 1 ? "Trade" : "Scale"}
                  </span>
                </div>
                <h3 className="relative mt-7 text-xl font-semibold text-[#061126] dark:text-white">{t(item.title)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{t(item.text)}</p>
                <div className="mt-6 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                  <span className="block h-2 rounded-full bg-primary transition-all group-hover:bg-profit" style={{ width: `${54 + index * 18}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RankUpShowcase section={rankSection} programs={rankPrograms} />

      <TraderJourneySection section={journeySection} metrics={homeMetrics} />

      <RealRewardsSection section={rewardsSection} metrics={homeMetrics} />

      <TradeOrbitSection section={tradeSection} />

      <CapitalEngineSection section={capitalSection} metrics={homeMetrics} />

      <StoryMissionSection section={storySection} metrics={homeMetrics} />

      <TraderDashboardSection section={dashboardSection} metrics={homeMetrics} />

      <MeetTraderSection section={mobileSection} metrics={homeMetrics} androidAppUrl={androidAppUrl} />

      <section className="bg-[#020817] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-300">{finalSection?.eyebrow ?? t("final.label")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{finalSection?.title ?? t("final.title")}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              [Award, "final.evaluation"],
              [Clock3, "final.fast"],
              [Medal, "final.affiliate"],
              [Sparkles, "final.mtReady"]
            ].map(([Icon, label]) => (
              <div key={label as string} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-center">
                <Icon className="mx-auto h-6 w-6 text-blue-300" />
                <h3 className="mt-4 font-semibold">{t(label as TranslationKey)}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{finalSection?.content ?? t("final.cardText")}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row">
            <BrandLogo tone="light" />
            <AuthAwareLink href="/auth/register" authenticatedHref="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300">
              {finalSection?.ctaLabel ?? t("final.cta")} <ChevronRight className="h-4 w-4" />
            </AuthAwareLink>
          </div>
        </div>
      </section>
    </main>
  );
}
