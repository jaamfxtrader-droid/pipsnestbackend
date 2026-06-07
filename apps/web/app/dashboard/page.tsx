"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock,
  LineChart,
  Loader2,
  Monitor,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Target,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";
import { isRememberedAuth, useAuthStore, type AuthUser } from "@/store/auth-store";

type AccountStatus = "PENDING" | "ACTIVE" | "PASSED" | "FAILED" | "SUSPENDED";

type Challenge = {
  id: string;
  name: string;
  accountSize: string | number;
  profitTargetPercent: number;
  dailyDrawdownPercent: number;
  maxDrawdownPercent: number;
};

type TradingStats = {
  id?: string;
  recordedAt?: string;
  balance: string | number;
  equity: string | number;
  profit: string | number;
  dailyDrawdown: string | number;
  maxDrawdown: string | number;
  profitTargetProgress: number;
  openTrades: number;
  closedTrades: number;
};

type TradingAccount = {
  id: string;
  platform: "MT4" | "MT5";
  login: string;
  server: string;
  stage?: "PHASE_1" | "PHASE_2" | "FUNDED";
  orderId?: string | null;
  balance: string | number;
  equity: string | number;
  accountStatus: AccountStatus;
  createdAt: string;
  challenge: Challenge;
  stats: TradingStats[];
};

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "FAILED" | "REFUNDED";
  total: string | number;
  createdAt: string;
  challenge: Challenge;
  payments: Array<{ status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" }>;
};

type PayoutOverview = {
  availableBalance: number;
  pendingPayouts: number;
  paidPayouts: number;
  ledger: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    date: string;
    details: string;
  }>;
};

const chartStroke = "#2563eb";
const profitColor = "#22c55e";
const warningColor = "#f59e0b";
const lossColor = "#ef4444";
const mutedColor = "#94a3b8";
const pieColors = [chartStroke, profitColor, warningColor, lossColor, "#14b8a6"];

function toNumber(value: number | string | undefined | null) {
  return Number(value ?? 0);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function isPaid(order: Order) {
  return order.status === "PAID" || order.payments.some((payment) => payment.status === "SUCCEEDED");
}

function statusTone(status: AccountStatus | string): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (["ACTIVE", "PASSED", "PAID", "SUCCEEDED", "APPROVED"].includes(status)) return "profit";
  if (["PENDING"].includes(status)) return "warning";
  if (["FAILED", "SUSPENDED", "CANCELLED", "REFUNDED", "REJECTED"].includes(status)) return "loss";
  return "neutral";
}

function stageLabel(stage?: string) {
  if (stage === "PHASE_1") return "Phase 1";
  if (stage === "PHASE_2") return "Phase 2";
  if (stage === "FUNDED") return "Real Account";
  return "Pending";
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(value);
}

function greetingFor(value: Date) {
  const hour = value.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function dayLabel(index: number, date?: string) {
  if (date) return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
  return `Point ${index + 1}`;
}

function buildFallbackSeries() {
  return [
    { label: "Mon", equity: 0, balance: 0, profit: 0 },
    { label: "Tue", equity: 0, balance: 0, profit: 0 },
    { label: "Wed", equity: 0, balance: 0, profit: 0 },
    { label: "Thu", equity: 0, balance: 0, profit: 0 },
    { label: "Fri", equity: 0, balance: 0, profit: 0 },
    { label: "Sat", equity: 0, balance: 0, profit: 0 }
  ];
}

function GlassActionOverlay({
  icon: Icon,
  title,
  description,
  href,
  actionLabel
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/55 p-5 backdrop-blur-md dark:bg-slate-950/55">
      <div className="w-full max-w-sm rounded-lg border border-white/60 bg-white/65 p-5 text-center shadow-[0_22px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-primary text-white shadow-lg">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        <Link href={href} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "primary",
  muted = false
}: {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  tone?: "primary" | "profit" | "warning" | "loss";
  muted?: boolean;
}) {
  const tones = {
    primary: "bg-primary/10 text-blue-700 dark:bg-primary/15 dark:text-blue-300",
    profit: "bg-profit/10 text-green-700 dark:bg-profit/15 dark:text-green-300",
    warning: "bg-warning/10 text-amber-700 dark:bg-warning/15 dark:text-amber-300",
    loss: "bg-loss/10 text-red-700 dark:bg-loss/15 dark:text-red-300"
  };

  return (
    <div className={cn("min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5", muted && "opacity-70")}>
      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{label}</p>
          <p className="mt-2 truncate text-lg font-semibold sm:text-2xl">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{change}</p>
        </div>
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md sm:h-10 sm:w-10", tones[tone])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
    </div>
  );
}

function ChartShell({
  title,
  description,
  children,
  empty,
  overlay
}: {
  title: string;
  description: string;
  children: ReactNode;
  empty?: boolean;
  overlay?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      {overlay}
      <div className={cn(empty && "opacity-45 blur-[1px]")}>
        <div className="mb-5">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function CandlestickChart({ data, empty }: { data: Array<{ label: string; open: number; close: number; high: number; low: number }>; empty?: boolean }) {
  const max = Math.max(...data.map((item) => item.high), 1);
  const min = Math.min(...data.map((item) => item.low), 0);
  const range = Math.max(max - min, 1);

  return (
    <div className={cn("grid h-64 grid-cols-8 items-end gap-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]", empty && "opacity-60")}>
      {data.map((item) => {
        const top = ((max - item.high) / range) * 100;
        const wickHeight = ((item.high - item.low) / range) * 100;
        const bodyTop = ((max - Math.max(item.open, item.close)) / range) * 100;
        const bodyHeight = Math.max(((Math.abs(item.close - item.open)) / range) * 100, 4);
        const positive = item.close >= item.open;

        return (
          <div key={item.label} className="relative h-full min-w-0">
            <div className="absolute left-1/2 w-px -translate-x-1/2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ top: `${top}%`, height: `${Math.max(wickHeight, 8)}%` }} />
            <div
              className={cn("absolute left-1/2 w-5 -translate-x-1/2 rounded-sm shadow-sm", positive ? "bg-profit" : "bg-loss")}
              style={{ top: `${bodyTop}%`, height: `${bodyHeight}%` }}
            />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-[10px] font-semibold text-slate-400">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const pushToast = useToast((state) => state.push);
  const [now, setNow] = useState<Date | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payoutOverview, setPayoutOverview] = useState<PayoutOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [profileData, accountData, orderData, payoutData] = await Promise.all([
        apiFetch<{ user: AuthUser }>("/auth/me", { token: authToken }),
        apiFetch<{ accounts: TradingAccount[] }>("/trading-accounts/my", { token: authToken }),
        apiFetch<{ orders: Order[] }>("/orders/my", { token: authToken }),
        apiFetch<PayoutOverview>("/payouts/overview", { token: authToken })
      ]);
      setAuth(authToken, profileData.user, { remember: isRememberedAuth("user"), scope: "user" });
      setAccounts(accountData.accounts);
      setOrders(orderData.orders);
      setPayoutOverview(payoutData);
    } catch (error) {
      pushToast({
        title: "Dashboard data not loaded",
        message: error instanceof Error ? error.message : "Please refresh and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope !== "user" || !token) return;
    loadData(token);
  }, [scope, token]);

  const activeAccounts = useMemo(() => accounts.filter((account) => account.accountStatus === "ACTIVE" || account.accountStatus === "PASSED"), [accounts]);
  const paidOrders = useMemo(() => orders.filter(isPaid), [orders]);
  const latestAccount = activeAccounts[0] ?? accounts[0] ?? null;
  const latestStats = latestAccount?.stats[0] ?? null;
  const hasChallenge = paidOrders.length > 0 || accounts.length > 0;
  const hasActiveAccount = activeAccounts.length > 0;
  const hasStats = activeAccounts.some((account) => account.stats.length > 0);

  const totals = useMemo(() => {
    const totalBalance = activeAccounts.reduce((sum, account) => sum + toNumber(account.balance), 0);
    const totalEquity = activeAccounts.reduce((sum, account) => sum + toNumber(account.equity), 0);
    const totalProfit = totalEquity - totalBalance;
    const averageProgress = activeAccounts.length
      ? activeAccounts.reduce((sum, account) => sum + (account.stats[0]?.profitTargetProgress ?? 0), 0) / activeAccounts.length
      : 0;

    return { totalBalance, totalEquity, totalProfit, averageProgress };
  }, [activeAccounts]);

  const equitySeries = useMemo(() => {
    if (!latestAccount?.stats.length) return buildFallbackSeries();
    return latestAccount.stats
      .slice()
      .reverse()
      .map((stat, index) => ({
        label: dayLabel(index, stat.recordedAt),
        equity: toNumber(stat.equity),
        balance: toNumber(stat.balance),
        profit: toNumber(stat.profit)
      }));
  }, [latestAccount]);

  const challengeSeries = useMemo(() => {
    if (!accounts.length) {
      return [
        { name: "Starter", value: 1 },
        { name: "Growth", value: 1 },
        { name: "Elite", value: 1 }
      ];
    }

    const counts = new Map<string, number>();
    for (const account of accounts) {
      counts.set(account.challenge.name, (counts.get(account.challenge.name) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [accounts]);

  const drawdownSeries = useMemo(() => {
    if (!latestAccount?.stats.length) {
      return [
        { label: "Daily", value: 0, limit: 5 },
        { label: "Max", value: 0, limit: 10 }
      ];
    }
    const stat = latestAccount.stats[0];
    return [
      { label: "Daily", value: toNumber(stat.dailyDrawdown), limit: latestAccount.challenge.dailyDrawdownPercent },
      { label: "Max", value: toNumber(stat.maxDrawdown), limit: latestAccount.challenge.maxDrawdownPercent }
    ];
  }, [latestAccount]);

  const candleSeries = useMemo(() => {
    const source = equitySeries.length ? equitySeries : buildFallbackSeries();
    return source.slice(-8).map((point, index) => {
      const base = point.equity || 1000 + index * 80;
      const open = index === 0 ? base - 40 : (source[index - 1]?.equity || base) + (index % 2 ? 30 : -25);
      const close = base;
      return {
        label: point.label.split(" ")[0],
        open,
        close,
        high: Math.max(open, close) + Math.max(20, Math.abs(close - open) * 0.35),
        low: Math.max(0, Math.min(open, close) - Math.max(20, Math.abs(close - open) * 0.35))
      };
    });
  }, [equitySeries]);

  const ledgerPreview = payoutOverview?.ledger.slice(0, 4) ?? [];
  const phaseSummaries = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; challengeName: string; accounts: number; equity: number; profit: number; progress: number }>();
    for (const account of accounts) {
      const stage = account.stage ?? "PHASE_1";
      const key = `${account.orderId ?? account.challenge.id}-${stage}`;
      const current = groups.get(key) ?? {
        key,
        label: stageLabel(stage),
        challengeName: account.challenge.name,
        accounts: 0,
        equity: 0,
        profit: 0,
        progress: 0
      };
      const stats = account.stats[0];
      current.accounts += 1;
      current.equity += toNumber(account.equity);
      current.profit += toNumber(stats?.profit);
      current.progress += Number(stats?.profitTargetProgress ?? 0);
      groups.set(key, current);
    }
    return Array.from(groups.values()).map((item) => ({
      ...item,
      progress: item.accounts ? item.progress / item.accounts : 0
    }));
  }, [accounts]);

  return (
    <>
      <PageHeader
        title="Trader Dashboard"
        description="Live account health, challenge progress, payouts, and performance overview."
        action={
          <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading || !token}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="p-6">
            <div className="text-sm font-semibold text-primary">{now ? greetingFor(now) : "Welcome back"}</div>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{user?.name ?? "Trader"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {hasChallenge
                ? "Your funded workspace is ready. Keep an eye on risk, progress, and payout availability from this overview."
                : "Start with a challenge purchase to unlock account requests, progress analytics, and payout tracking."}
            </p>
          </div>
          <div className="border-t border-slate-200 p-6 dark:border-white/10 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <div className="font-mono text-2xl font-black">{now ? formatTime(now) : "--:--:--"}</div>
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Local dashboard clock</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mb-6">
        {!hasChallenge && !loading ? (
          <GlassActionOverlay
            icon={ShoppingCart}
            title="Buy a challenge to activate your dashboard"
            description="Cards and charts are ready. Once your challenge is purchased and approved, live account data will appear here."
            href="/dashboard/challenges"
            actionLabel="Buy Challenge"
          />
        ) : null}
        <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4", !hasChallenge && !loading && "blur-[1px]")}>
          <MetricCard label="Total Equity" value={currency(totals.totalEquity)} change={`${activeAccounts.length} active account${activeAccounts.length === 1 ? "" : "s"}`} icon={LineChart} tone="profit" muted={!hasChallenge} />
          <MetricCard label="Profit" value={currency(totals.totalProfit)} change="Across active accounts" icon={BadgeDollarSign} tone={totals.totalProfit >= 0 ? "profit" : "loss"} muted={!hasChallenge} />
          <MetricCard label="Progress" value={formatPercent(totals.averageProgress)} change="Average target completion" icon={Target} tone="primary" muted={!hasChallenge} />
          <MetricCard label="Available Payout" value={currency(payoutOverview?.availableBalance ?? 0)} change={`${currency(payoutOverview?.pendingPayouts ?? 0)} pending`} icon={Wallet} tone="warning" muted={!hasChallenge} />
        </div>
      </section>

      {phaseSummaries.length ? (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Phase Activity</h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Equity subtotals by challenge stage</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {phaseSummaries.map((item) => (
              <div key={item.key} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
                <p className="truncate text-xs font-semibold text-primary sm:text-sm">{item.label}</p>
                <h3 className="mt-1 truncate text-sm font-semibold sm:text-base">{item.challengeName}</h3>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  <span className="flex min-w-0 justify-between gap-2"><span>Equity</span><strong className="truncate text-slate-950 dark:text-white">{currency(item.equity)}</strong></span>
                  <span className="flex min-w-0 justify-between gap-2"><span>Profit</span><strong className="truncate text-slate-950 dark:text-white">{currency(item.profit)}</strong></span>
                  <span className="flex min-w-0 justify-between gap-2"><span>Progress</span><strong className="truncate text-slate-950 dark:text-white">{formatPercent(item.progress)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <ChartShell
            title="Equity Curve"
            description={hasStats ? `${latestAccount?.platform ?? "Account"} performance history` : "No synced trading stats yet"}
            empty={!hasStats}
            overlay={!hasChallenge && !loading ? undefined : !hasStats && !loading ? (
              <GlassActionOverlay
                icon={Monitor}
                title="Sync or apply for a trading account"
                description="Once an account is active and synced, the equity line will be drawn from live account stats."
                href="/dashboard/accounts"
                actionLabel="Trading Accounts"
              />
            ) : undefined}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equitySeries}>
                  <defs>
                    <linearGradient id="dashboardEquity" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={profitColor} stopOpacity={0.55} />
                      <stop offset="95%" stopColor={profitColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="label" stroke={mutedColor} tickLine={false} axisLine={false} />
                  <YAxis stroke={mutedColor} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff" }} />
                  <Area type="monotone" dataKey="equity" stroke={profitColor} fill="url(#dashboardEquity)" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="balance" stroke={chartStroke} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartShell title="Candle Movement" description={hasStats ? "Equity movement by sync point" : "Waiting for trading data"} empty={!hasStats}>
              <CandlestickChart data={candleSeries} empty={!hasStats} />
            </ChartShell>

            <ChartShell title="Drawdown Control" description={hasStats ? "Current drawdown vs challenge limit" : "No drawdown stats synced"} empty={!hasStats}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={drawdownSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="label" stroke={mutedColor} tickLine={false} axisLine={false} />
                    <YAxis stroke={mutedColor} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff" }} />
                    <Bar dataKey="limit" fill="rgba(148,163,184,0.35)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="value" fill={warningColor} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>
          </div>

          <ChartShell title="Profit Trend" description={hasStats ? "Profit by latest sync points" : "Profit history appears after sync"} empty={!hasStats}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={equitySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="label" stroke={mutedColor} tickLine={false} axisLine={false} />
                  <YAxis stroke={mutedColor} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value)}`} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff" }} />
                  <Line type="monotone" dataKey="profit" stroke={chartStroke} strokeWidth={2.5} dot={{ r: 3 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>
        </div>

        <aside className="grid gap-6">
          <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            {!hasActiveAccount && !loading ? (
              <GlassActionOverlay
                icon={Monitor}
                title="No server assigned yet"
                description="Apply for MT4/MT5 after buying a challenge. Assigned server credentials will appear here."
                href="/dashboard/accounts"
                actionLabel="Open Accounts"
              />
            ) : null}
            <div className={cn(!hasActiveAccount && !loading && "opacity-40 blur-[1px]")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{latestAccount?.platform ?? "MT5"} / {latestAccount?.server ?? "Pending server"}</p>
                  <h3 className="mt-1 text-lg font-semibold">{latestAccount?.accountStatus === "ACTIVE" || latestAccount?.accountStatus === "PASSED" ? latestAccount.login : "No server assigned"}</h3>
                </div>
                <Badge tone={statusTone(latestAccount?.accountStatus ?? "PENDING")}>{latestAccount?.accountStatus ?? "PENDING"}</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Challenge</span><strong className="block">{latestAccount?.challenge.name ?? "No challenge"}</strong></div>
                <div><span className="text-slate-500">Equity</span><strong className="block">{currency(latestAccount?.equity ?? 0)}</strong></div>
                <div><span className="text-slate-500">Profit</span><strong className="block">{currency(latestStats?.profit ?? 0)}</strong></div>
                <div><span className="text-slate-500">Trades</span><strong className="block">{latestStats ? latestStats.openTrades + latestStats.closedTrades : 0}</strong></div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm"><span>Target progress</span><strong>{formatPercent(latestStats?.profitTargetProgress ?? 0)}</strong></div>
                <ProgressBar value={latestStats?.profitTargetProgress ?? 0} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-4">
              <h2 className="font-semibold">Challenge Mix</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{accounts.length ? "Accounts by challenge" : "Challenge data appears after purchase"}</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={challengeSeries} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3}>
                    {challengeSeries.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {challengeSeries.slice(0, 4).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                    {item.name}
                  </span>
                  <strong>{accounts.length ? item.value : 0}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-profit/10 text-green-700 dark:bg-profit/15 dark:text-green-300">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Payout snapshot</p>
                <h3 className="text-xl font-semibold">{currency(payoutOverview?.availableBalance ?? 0)}</h3>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between"><span>Pending</span><Badge tone="warning">{currency(payoutOverview?.pendingPayouts ?? 0)}</Badge></div>
              <div className="flex items-center justify-between"><span>Paid</span><Badge tone="profit">{currency(payoutOverview?.paidPayouts ?? 0)}</Badge></div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Recent Ledger</h2>
            </div>
            <div className="grid gap-3">
              {ledgerPreview.length ? (
                ledgerPreview.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm dark:bg-white/[0.04]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{item.type}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.details}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <strong className="block">{currency(item.amount)}</strong>
                      <Badge tone={statusTone(item.status)} className="mt-1">{item.status}</Badge>
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                  Ledger activity will appear after purchases, payouts, or affiliate commissions.
                </div>
              )}
            </div>
          </section>

          <Link href="/dashboard/challenges" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
            <ShieldCheck className="h-4 w-4" />
            View Challenges
          </Link>
        </aside>
      </div>
    </>
  );
}
