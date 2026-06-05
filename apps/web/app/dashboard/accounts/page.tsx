"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, BarChart3, CheckCircle2, Clock, KeyRound, LinkIcon, Loader2, Monitor, Send, Server, ShieldOff, ShoppingCart, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRememberedAuth, useAuthStore, type AuthUser } from "@/store/auth-store";

type Platform = "MT4" | "MT5";
type AccountStatus = "PENDING" | "ACTIVE" | "PASSED" | "FAILED" | "SUSPENDED";
type ChallengeStage = "PHASE_1" | "PHASE_2" | "FUNDED";

type Challenge = {
  id: string;
  name: string;
  accountSize: string | number;
  profitTargetPercent: number;
  dailyDrawdownPercent: number;
  maxDrawdownPercent: number;
  phaseCount: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "FAILED" | "REFUNDED";
  createdAt: string;
  challenge: Challenge;
  payments: Array<{ status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" }>;
};

type TradingAccount = {
  id: string;
  platform: Platform;
  login: string;
  password?: string | null;
  investorPassword?: string | null;
  server: string;
  serverLink?: string | null;
  stage: ChallengeStage;
  statusReason?: string | null;
  balance: string | number;
  equity: string | number;
  accountStatus: AccountStatus;
  completedAt?: string | null;
  disabledAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  orderId?: string | null;
  challenge: Challenge;
  stats: Array<{ profitTargetProgress: number }>;
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function statusTone(status: AccountStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "ACTIVE" || status === "PASSED") return "profit";
  if (status === "FAILED" || status === "SUSPENDED") return "loss";
  return "warning";
}

function isPaid(order: Order) {
  return order.status === "PAID" || order.payments.some((payment) => payment.status === "SUCCEEDED");
}

function platformIcon(platform: Platform) {
  return platform === "MT4" ? "4" : "5";
}

function stageLabel(stage: ChallengeStage) {
  if (stage === "PHASE_1") return "Phase 1";
  if (stage === "PHASE_2") return "Phase 2";
  return "Real Account";
}

function firstStageFor(phaseCount: number): ChallengeStage {
  return Number(phaseCount) <= 0 ? "FUNDED" : "PHASE_1";
}

function nextStageFor(account: TradingAccount): ChallengeStage | null {
  if (account.stage === "PHASE_1") return account.challenge.phaseCount >= 2 ? "PHASE_2" : "FUNDED";
  if (account.stage === "PHASE_2") return "FUNDED";
  return null;
}

function credentialValue(value?: string | null) {
  return value && !value.startsWith("PN-") ? value : "Pending assignment";
}

export default function AccountsPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const setAuth = useAuthStore((state) => state.setAuth);
  const pushToast = useToast((state) => state.push);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  useEffect(() => {
    if (scope !== "user" || !token) return;
    apiFetch<{ user: AuthUser }>("/auth/me", { token })
      .then((data) => setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" }))
      .catch(() => undefined);
  }, [scope, setAuth, token]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [accountData, orderData] = await Promise.all([
        apiFetch<{ accounts: TradingAccount[] }>("/trading-accounts/my", { token: authToken }),
        apiFetch<{ orders: Order[] }>("/orders/my", { token: authToken })
      ]);
      setAccounts(accountData.accounts);
      setOrders(orderData.orders);
    } catch (error) {
      pushToast({
        title: "Trading accounts not loaded",
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

  const paidOrders = useMemo(() => orders.filter(isPaid), [orders]);

  function appliedPlatforms(orderId: string) {
    const order = orders.find((item) => item.id === orderId);
    const firstStage = firstStageFor(order?.challenge.phaseCount ?? 2);
    return new Set(accounts.filter((account) => account.orderId === orderId && account.stage === firstStage).map((account) => account.platform));
  }

  function openApply(order: Order) {
    const alreadyApplied = appliedPlatforms(order.id);
    const availablePlatforms = (["MT4", "MT5"] as Platform[]).filter((platform) => !alreadyApplied.has(platform));
    setSelectedOrder(order);
    setSelectedPlatforms(availablePlatforms.slice(0, 1));
  }

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]
    );
  }

  async function applyForAccount() {
    if (!token || !selectedOrder || !selectedPlatforms.length) return;
    setSubmitting(true);
    try {
      const data = await apiFetch<{ accounts: TradingAccount[]; message: string }>("/trading-accounts/apply", {
        method: "POST",
        token,
        body: JSON.stringify({ orderId: selectedOrder.id, platforms: selectedPlatforms, stage: firstStageFor(selectedOrder.challenge.phaseCount) })
      });
      setAccounts((current) => [...data.accounts, ...current]);
      setSelectedOrder(null);
      setSelectedPlatforms([]);
      pushToast({ title: "Request submitted", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Request not submitted",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function applyForNextStage(account: TradingAccount) {
    if (!token || !account.orderId) return;
    const nextStage = nextStageFor(account);
    if (!nextStage) return;

    setSubmitting(true);
    try {
      const data = await apiFetch<{ accounts: TradingAccount[]; message: string }>("/trading-accounts/apply", {
        method: "POST",
        token,
        body: JSON.stringify({ orderId: account.orderId, platforms: [account.platform], stage: nextStage })
      });
      setAccounts((current) => [...data.accounts, ...current]);
      pushToast({ title: "Next stage requested", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Request not submitted",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Trading Accounts" description="Apply for MT4/MT5 accounts after buying a challenge. Approval usually takes 4-5 hours." action={<Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Refresh</Button>} />

      {loading ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {paidOrders.length === 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-warning/10 text-amber-700 dark:text-amber-300">
                    <ShoppingCart className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">Challenge purchase required</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">A paid challenge is required before you can request a trading server. Once a challenge is purchased, MT4/MT5 account requests will unlock here.</p>
                  </div>
                </div>
                <Link href="/funding-programs" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
                  <ShoppingCart className="h-4 w-4" />
                  Buy Challenge
                </Link>
              </div>
            </section>
          ) : null}

          {paidOrders.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
                  <Send className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Apply for account</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Select a paid challenge and request the first eligible MT4, MT5, or both servers.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {paidOrders.map((order) => {
                  const applied = appliedPlatforms(order.id);
                  const canApply = applied.size < 2;
                  const firstStage = firstStageFor(order.challenge.phaseCount);

                  return (
                    <div key={order.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold">{order.challenge.name}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.orderNumber} / {formatCurrency(order.challenge.accountSize)}</p>
                        </div>
                        <Badge tone="profit">Paid</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(["MT4", "MT5"] as Platform[]).map((platform) => (
                          <span key={platform} className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold", applied.has(platform) ? "bg-profit/10 text-green-700 dark:text-green-300" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300")}>
                            <span className="grid h-5 w-5 place-items-center rounded bg-slate-950 text-[11px] font-black text-white">{platformIcon(platform)}</span>
                            {platform} {applied.has(platform) ? `${stageLabel(firstStage)} applied` : "available"}
                          </span>
                        ))}
                      </div>
                      {canApply ? (
                        <Button type="button" className="mt-4 w-full" onClick={() => openApply(order)}>
                          <Send className="h-4 w-4" />
                          Apply for Account
                        </Button>
                      ) : (
                        <div className="mt-4 rounded-md border border-profit/20 bg-profit/10 p-3 text-sm font-semibold text-green-700 dark:text-green-300">
                          Both MT4 and MT5 {stageLabel(firstStage)} requests already exist for this challenge.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-2">
            {accounts.map((account) => {
              const active = account.accountStatus === "ACTIVE";
              const pending = account.accountStatus === "PENDING";
              const passed = account.accountStatus === "PASSED";
              const failed = account.accountStatus === "FAILED";
              const suspended = account.accountStatus === "SUSPENDED";
              const progress = account.stats[0]?.profitTargetProgress ?? 0;
              const nextStage = passed ? nextStageFor(account) : null;

              return (
                <article key={account.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid h-11 w-11 place-items-center rounded-md",
                          active || passed
                            ? "bg-profit/10 text-green-700 dark:text-green-300"
                            : failed || suspended
                              ? "bg-loss/10 text-red-700 dark:text-red-300"
                              : "bg-warning/10 text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {active ? <Monitor className="h-5 w-5" /> : passed ? <Trophy className="h-5 w-5" /> : failed || suspended ? <ShieldOff className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </span>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {account.platform} / {stageLabel(account.stage)} / {account.challenge.name}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">{active ? account.login : passed ? "Stage completed" : failed || suspended ? "Server disabled" : "No server assigned"}</h3>
                      </div>
                    </div>
                    <Badge tone={statusTone(account.accountStatus)}>{account.accountStatus}</Badge>
                  </div>

                  {pending ? (
                    <div className="mt-5 rounded-lg border border-warning/20 bg-warning/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                      <div className="font-semibold">Pending approval</div>
                      <p className="mt-1 leading-6">After admin approval, the server link, login/server number, password, and investor password will appear here. Typical approval time is 4-5 hours.</p>
                    </div>
                  ) : failed || suspended ? (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        {failed ? "Package expired" : "Account suspended"}
                      </div>
                      <p className="mt-1 leading-6">
                        The trading server is disabled for this challenge stage. {account.statusReason ?? "Contact support if you need a manual review."}
                      </p>
                    </div>
                  ) : passed ? (
                    <div className="mt-5 grid gap-4 rounded-lg border border-profit/20 bg-profit/10 p-4 text-sm text-green-800 dark:text-green-200">
                      <div>
                        <div className="flex items-center gap-2 font-semibold">
                          <Trophy className="h-4 w-4" />
                          {stageLabel(account.stage)} completed
                        </div>
                        <p className="mt-1 leading-6">
                          {nextStage
                            ? `You can now apply for ${stageLabel(nextStage)}. Admin will assign a fresh ${account.platform} server after approval.`
                            : "Your real account stage is marked complete."}
                        </p>
                      </div>
                      {nextStage ? (
                        <Button type="button" onClick={() => applyForNextStage(account)} disabled={submitting}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Apply for {stageLabel(nextStage)}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Server className="h-4 w-4" />Server</span>
                          <strong className="mt-1 block">{credentialValue(account.server)}</strong>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><KeyRound className="h-4 w-4" />Password</span>
                          <strong className="mt-1 block">{credentialValue(account.password)}</strong>
                        </div>
                      </div>
                      {account.investorPassword ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><BadgeCheck className="h-4 w-4" />Investor password</span>
                          <strong className="mt-1 block">{account.investorPassword}</strong>
                        </div>
                      ) : null}
                      {account.serverLink ? (
                        <a href={account.serverLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 font-semibold text-primary transition hover:bg-primary/15">
                          <LinkIcon className="h-4 w-4" />
                          Open server link
                        </a>
                      ) : null}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <span className="text-slate-500 dark:text-slate-400">Balance</span>
                          <strong className="mt-1 block">{formatCurrency(account.balance)}</strong>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <span className="text-slate-500 dark:text-slate-400">Target progress</span>
                          <strong className="mt-1 block">{Math.round(progress)}%</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {paidOrders.length > 0 && accounts.length === 0 ? (
              <article className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm dark:border-white/15 dark:bg-white/[0.03] lg:col-span-2">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  <BarChart3 className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold">No server assigned yet</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Your paid challenge is ready. Use the MT4/MT5 apply button; credentials will appear here after admin approval.</p>
              </article>
            ) : null}
          </section>
        </div>
      )}

      {selectedOrder ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950">
            <div className="border-b border-slate-200 p-5 dark:border-white/10">
              <h2 className="text-xl font-semibold">Apply for {selectedOrder.challenge.name}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select one or both platforms for {stageLabel(firstStageFor(selectedOrder.challenge.phaseCount))}. Approval usually takes 4-5 hours.</p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {(["MT4", "MT5"] as Platform[]).map((platform) => {
                const disabled = appliedPlatforms(selectedOrder.id).has(platform);
                const selected = selectedPlatforms.includes(platform);

                return (
                  <button
                    key={platform}
                    type="button"
                    disabled={disabled}
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                      selected
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-slate-200 bg-slate-50 hover:border-primary/35 dark:border-white/10 dark:bg-white/[0.04]"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-md bg-slate-950 text-lg font-black text-white">{platformIcon(platform)}</span>
                      <span>
                        <span className="block font-semibold">{platform}</span>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{disabled ? `${stageLabel(firstStageFor(selectedOrder.challenge.phaseCount))} already applied` : "Available"}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-4 dark:border-white/10">
              <Button type="button" variant="secondary" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyForAccount} disabled={submitting || !selectedPlatforms.length}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
