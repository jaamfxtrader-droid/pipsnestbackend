"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, DollarSign, Info, Repeat, ShieldCheck, Target } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";

type RankPhase = "one" | "two";

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
  phaseCount: 1 | 2;
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

const rankPhases: Array<{ key: RankPhase; label: string; count: 1 | 2; title: string }> = [
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

function normalizeRankChallenge(challenge: ApiChallenge): RankProgram {
  const phaseCount = Number(challenge.phaseCount ?? 2) === 1 ? 1 : 2;
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
  if (phase === "one") return index === 1 ? `${program.profitTargetPercent}%` : "-";
  return index === 1 ? `${program.profitTargetPercent}%` : `${Math.max(program.profitTargetPercent - 3, 5)}%`;
}

function displayProgramsForPhase(programs: RankProgram[], phase: RankPhase) {
  const phaseCount = rankPhases.find((item) => item.key === phase)?.count ?? 2;
  return programs.filter((program) => program.phaseCount === phaseCount).sort((left, right) => left.accountSize - right.accountSize);
}

function CurrencyPicker({
  value,
  onChange
}: {
  value: (typeof rankCurrencies)[number]["code"];
  onChange: (value: (typeof rankCurrencies)[number]["code"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = rankCurrencies.find((item) => item.code === value) ?? rankCurrencies[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
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
        <div className="absolute right-0 top-14 z-40 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-[0_22px_60px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#0b172d]">
          {rankCurrencies.map((item) => (
            <button
              key={item.code}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
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

function ChallengeProgramCard({
  program,
  currencyOption,
  phase,
  featured
}: {
  program: RankProgram;
  currencyOption: (typeof rankCurrencies)[number];
  phase: RankPhase;
  featured: boolean;
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
          Buy Challenge <ArrowRight className="h-4 w-4" />
        </Button>
      </AuthAwareLink>

      <div className={cn("mt-4 grid gap-3 rounded-md p-4 text-left", featured ? "bg-white/12" : "bg-slate-100 dark:bg-[#0a172c] dark:text-slate-100")}>
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
            <strong>-</strong>
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
      </div>

      <p className={cn("mt-auto pt-5 text-center text-sm", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
        Traders earn <strong className={featured ? "text-white" : "text-[#061126] dark:text-white"}>{formatConvertedPrice(rewardEstimate, currencyOption)}</strong> avg first rewards
      </p>
    </article>
  );
}

function ChallengeCardSkeleton() {
  return (
    <div className="min-h-[26rem] animate-pulse rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#10203b]">
      <div className="flex justify-between gap-4">
        <div className="h-16 w-32 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-16 w-24 rounded bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="mt-5 h-11 rounded-md bg-slate-200 dark:bg-white/10" />
      <div className="mt-4 h-48 rounded-md bg-slate-200 dark:bg-white/10" />
      <div className="mt-5 h-4 rounded bg-slate-200 dark:bg-white/10" />
    </div>
  );
}

export function ChallengeProgramGrid() {
  const [programs, setPrograms] = useState<RankProgram[]>([]);
  const [phase, setPhase] = useState<RankPhase>("two");
  const [currencyCode, setCurrencyCode] = useState<(typeof rankCurrencies)[number]["code"]>("USD");
  const [loading, setLoading] = useState(true);
  const currencyOption = rankCurrencies.find((item) => item.code === currencyCode) ?? rankCurrencies[0];
  const visiblePrograms = useMemo(() => displayProgramsForPhase(programs, phase), [programs, phase]);
  const activePhase = rankPhases.find((item) => item.key === phase) ?? rankPhases[2];

  useEffect(() => {
    let mounted = true;

    apiFetch<{ challenges: ApiChallenge[] }>("/challenges")
      .then((data) => {
        if (!mounted) return;
        setPrograms(data.challenges.map(normalizeRankChallenge));
      })
      .catch(() => {
        if (mounted) setPrograms([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {rankPhases.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPhase(item.key)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-black transition",
                phase === item.key
                  ? "border-[#082f73] bg-[#082f73] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              )}
            >
              {item.key === "two" ? <Repeat className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              {item.label}
            </button>
          ))}
        </div>
        <CurrencyPicker value={currencyCode} onChange={setCurrencyCode} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Badge tone="primary">{activePhase.title}</Badge>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Showing {visiblePrograms.length} active admin challenge{visiblePrograms.length === 1 ? "" : "s"} from the same data used in the trader dashboard.
        </span>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? [0, 1, 2, 3, 4, 5].map((item) => <ChallengeCardSkeleton key={item} />)
          : visiblePrograms.map((program) => (
              <ChallengeProgramCard
                key={program.id}
                program={program}
                currencyOption={currencyOption}
                phase={phase}
                featured={Boolean(program.featured)}
              />
            ))}
      </div>

      {!loading && visiblePrograms.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="text-xl font-black text-[#061126] dark:text-white">No active challenges in this phase</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Active challenges added from admin will appear here exactly like the trader dashboard.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-3">
        {[
          ["Clear evaluation rules", ShieldCheck],
          ["MT4/MT5-ready workflow", BarChart3],
          ["Dashboard purchase tracking", CheckCircle2]
        ].map(([item, Icon]) => (
          <div key={item as string} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white">
              <Icon className="h-4 w-4" />
            </span>
            {item as string}
          </div>
        ))}
      </div>
    </section>
  );
}
