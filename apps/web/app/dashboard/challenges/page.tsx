"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Crown,
  Eye,
  Info,
  Landmark,
  Layers3,
  ListChecks,
  Loader2,
  Repeat,
  Route,
  ShieldCheck,
  Target,
  Wallet,
  WalletCards
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QrCodeCard } from "@/components/ui/qr-code-card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type Challenge = {
  id: string;
  name: string;
  slug: string;
  description: string;
  accountSize: number | string;
  price: number | string;
  profitTargetPercent: number;
  dailyDrawdownPercent: number;
  maxDrawdownPercent: number;
  minTradingDays: number;
  leverage: string;
  phaseCount: number;
};

type TradingAccount = {
  id: string;
  orderId?: string | null;
  login: string;
  platform: "MT4" | "MT5";
  server: string;
  balance: number | string;
  equity: number | string;
  accountStatus: string;
  challenge: Challenge;
  stats: Array<{
    profitTargetProgress: number;
    dailyDrawdown: number | string;
    maxDrawdown: number | string;
    profit: number | string;
    openTrades: number;
    closedTrades: number;
  }>;
};

type Order = {
  id: string;
  orderNumber: string;
  total: number | string;
  status: string;
  createdAt: string;
  challenge: Challenge;
  payments: Array<{ status: string; provider: string }>;
};

const paymentMethods = [
  { id: "topup", label: "Top-up Balance", status: "Active", icon: ShieldCheck, enabled: true },
  { id: "bank", label: "Bank", status: "Coming soon", icon: Landmark, enabled: false },
  { id: "crypto", label: "Crypto", status: "NOWPayments", icon: Wallet, enabled: true },
  { id: "card", label: "Card", status: "Coming soon", icon: CreditCard, enabled: false }
] as const;

type TopUpOverview = {
  balance: number;
};

type CryptoCheckout = {
  paymentId: string;
  status: string;
  payAddress?: string;
  payAmount?: number;
  payCurrency?: string;
  priceAmount?: number;
  priceCurrency?: string;
  order: Order;
};

const terminalOrderStatuses = ["CANCELLED", "FAILED", "REFUNDED"];
const terminalAccountStatuses = ["FAILED", "SUSPENDED"];

type RankPhase = "zero" | "one" | "two";
type RankView = "cards" | "phases";

const rankPhases: Array<{ key: RankPhase; label: string; title: string }> = [
  { key: "zero", label: "Zero", title: "Instant funded" },
  { key: "one", label: "1 Step", title: "Single evaluation" },
  { key: "two", label: "2 Step", title: "Two phase route" }
];

const rewardProfile = {
  splitPercent: 80,
  cycle: "Biweekly",
  description: "Balanced rules with strong first rewards."
};

function toNumber(value: number | string) {
  return Number(value ?? 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function statusTone(status: string): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (["ACTIVE", "PASSED", "PAID", "SUCCEEDED"].includes(status)) return "profit";
  if (["PENDING"].includes(status)) return "warning";
  if (["FAILED", "SUSPENDED", "CANCELLED", "REFUNDED"].includes(status)) return "loss";
  return "neutral";
}

function programPhase(program: Challenge): RankPhase {
  const count = Number(program.phaseCount ?? 2);
  if (count <= 0) return "zero";
  if (count === 1) return "one";
  return "two";
}

function phaseTarget(program: Challenge, phase: RankPhase, index: 1 | 2) {
  if (phase === "zero") return "-";
  if (phase === "one") return index === 1 ? `${program.profitTargetPercent}%` : "-";
  return index === 1 ? `${program.profitTargetPercent}%` : `${Math.max(program.profitTargetPercent - 3, 5)}%`;
}

function phaseStepsFor(phase: RankPhase) {
  if (phase === "zero") return ["Funded"];
  if (phase === "one") return ["Evaluation", "Master"];
  return ["Phase 1", "Phase 2", "Master"];
}

function isPaidOrder(order: Order) {
  return order.status === "PAID" || order.payments.some((payment) => payment.status === "SUCCEEDED");
}

export default function MyChallengesPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [topUpBalance, setTopUpBalance] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("topup");
  const [phase, setPhase] = useState<RankPhase>("two");
  const [view, setView] = useState<RankView>("cards");
  const [cardStart, setCardStart] = useState(0);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState("");
  const [cryptoCheckout, setCryptoCheckout] = useState<CryptoCheckout | null>(null);
  const [confirmCancelCheckout, setConfirmCancelCheckout] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  async function loadData(authToken = token) {
    setLoading(true);
    try {
      const challengeData = await apiFetch<{ challenges: Challenge[] }>("/challenges");
      setChallenges(challengeData.challenges);

      if (authToken) {
        const [accountData, orderData, topUpData] = await Promise.all([
          apiFetch<{ accounts: TradingAccount[] }>("/trading-accounts/my", { token: authToken }),
          apiFetch<{ orders: Order[] }>("/orders/my", { token: authToken }),
          apiFetch<TopUpOverview>("/topups/overview", { token: authToken })
        ]);
        setAccounts(accountData.accounts);
        setOrders(orderData.orders);
        setTopUpBalance(topUpData.balance);
      }
    } catch (error) {
      pushToast({
        title: "Challenge data not loaded",
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

  useEffect(() => {
    if (scope !== "user" || !token) return;
    apiFetch<{ checkout: CryptoCheckout | null }>("/payments/nowpayments/pending", { token })
      .then((data) => {
        if (data.checkout) setCryptoCheckout(data.checkout);
      })
      .catch(() => undefined);
  }, [scope, token]);

  const activeAccounts = useMemo(() => accounts.filter((account) => account.accountStatus !== "SUSPENDED"), [accounts]);
  const visibleOrders = useMemo(() => orders.filter((order) => isPaidOrder(order) || terminalOrderStatuses.includes(order.status)), [orders]);
  const visiblePrograms = useMemo(
    () => challenges.filter((challenge) => programPhase(challenge) === phase).sort((left, right) => toNumber(left.accountSize) - toNumber(right.accountSize)),
    [challenges, phase]
  );
  const maxCardStart = Math.max(0, visiblePrograms.length - 4);
  const carouselPrograms = useMemo(() => visiblePrograms.slice(cardStart, cardStart + 4), [cardStart, visiblePrograms]);
  const selectedProgram = useMemo(
    () => visiblePrograms.find((program) => program.id === selectedProgramId) ?? visiblePrograms[0],
    [selectedProgramId, visiblePrograms]
  );
  const openChallengeOrder = useMemo(
    () =>
      orders.find((order) => {
        if (!isPaidOrder(order) || terminalOrderStatuses.includes(order.status)) return false;
        const linkedAccounts = accounts.filter((account) => account.orderId === order.id);
        return linkedAccounts.length === 0 || linkedAccounts.some((account) => !terminalAccountStatuses.includes(account.accountStatus));
      }),
    [accounts, orders]
  );
  const purchaseLocked = Boolean(openChallengeOrder);
  const purchaseLockMessage = openChallengeOrder
    ? `Complete or expire ${openChallengeOrder.challenge?.name ?? "your current challenge"} before buying another challenge.`
    : "";

  useEffect(() => {
    setCardStart(0);
  }, [phase, challenges.length]);

  useEffect(() => {
    setCardStart((current) => Math.min(current, maxCardStart));
  }, [maxCardStart]);

  useEffect(() => {
    if (!visiblePrograms.length) return;
    if (visiblePrograms.some((program) => program.id === selectedProgramId)) return;
    setSelectedProgramId(visiblePrograms[Math.min(3, visiblePrograms.length - 1)].id);
  }, [selectedProgramId, visiblePrograms]);

  async function purchaseChallenge(challengeId: string, paymentMethod: "TOPUP_BALANCE" | "CRYPTO") {
    if (!token) return;
    if (purchaseLocked) {
      pushToast({
        title: "Challenge already active",
        message: purchaseLockMessage,
        tone: "info"
      });
      return;
    }
    setPurchasingId(challengeId);

    try {
      const orderData = await apiFetch<{ order: Order; checkout?: Omit<CryptoCheckout, "order"> }>("/orders", {
        method: "POST",
        token,
        body: JSON.stringify({
          challengeId,
          couponCode: couponCode.trim() || undefined,
          paymentMethod
        })
      });
      if (paymentMethod === "CRYPTO") {
        if (!orderData.checkout) throw new Error("Crypto checkout was not returned.");
        setCryptoCheckout({ ...orderData.checkout, order: orderData.order });
        pushToast({
          title: "Crypto checkout created",
          message: "Send the exact amount shown in the payment modal, then check payment status.",
          tone: "success"
        });
        return;
      }
      pushToast({
        title: "Challenge purchased",
        message: `${orderData.order.challenge.name} was purchased with top-up balance.`,
        tone: "success"
      });
      setCouponCode("");
      await loadData(token);
    } catch (error) {
      pushToast({
        title: "Order not created",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setPurchasingId("");
    }
  }

  async function checkCryptoPayment() {
    if (!token || !cryptoCheckout) return;
    setCheckingPayment(true);
    try {
      const data = await apiFetch<{ status: string; mappedStatus: string }>(`/payments/nowpayments/${cryptoCheckout.paymentId}/status`, { token });
      if (data.mappedStatus === "SUCCEEDED") {
        pushToast({ title: "Payment confirmed", message: "Challenge order is now paid.", tone: "success" });
        setCryptoCheckout(null);
        await loadData(token);
        return;
      }
      if (data.mappedStatus === "FAILED") {
        pushToast({ title: "Payment rejected", message: `NOWPayments status: ${data.status}.`, tone: "error" });
        await loadData(token);
        return;
      }
      pushToast({ title: "Payment pending", message: `NOWPayments status: ${data.status}.`, tone: "info" });
    } catch (error) {
      pushToast({ title: "Payment check failed", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
    } finally {
      setCheckingPayment(false);
    }
  }

  async function cancelCryptoCheckout() {
    if (!token || !cryptoCheckout) return;
    setCancellingPayment(true);
    try {
      await apiFetch(`/payments/nowpayments/${cryptoCheckout.paymentId}/cancel`, {
        method: "POST",
        token
      });
      pushToast({
        title: "Crypto checkout cancelled",
        message: "Your pending crypto checkout was cancelled. You can start a new checkout anytime.",
        tone: "info"
      });
      setConfirmCancelCheckout(false);
      setCryptoCheckout(null);
      await loadData(token);
    } catch (error) {
      pushToast({
        title: "Checkout not cancelled",
        message: error instanceof Error ? error.message : "Please check payment status before trying again.",
        tone: "error"
      });
    } finally {
      setCancellingPayment(false);
    }
  }

  function copyPaymentAddress() {
    if (!cryptoCheckout?.payAddress) return;
    navigator.clipboard?.writeText(cryptoCheckout.payAddress).then(() => {
      pushToast({ title: "Address copied", message: "Crypto payment address copied.", tone: "success" });
    }).catch(() => undefined);
  }

  return (
    <>
      <PageHeader title="My Challenges" description="Challenge progress, accounts, purchases, and available programs in one place." />

      <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Trading accounts</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{activeAccounts.length}</div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Challenge orders</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{visibleOrders.length}</div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Available programs</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{challenges.length}</div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Top-up balance</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{currency(topUpBalance)}</div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Current Progress</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">Loading accounts...</div>
          ) : activeAccounts.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">No assigned trading accounts yet.</div>
          ) : (
            activeAccounts.map((account) => {
              const latestStats = account.stats[0];
              const progress = Math.round(latestStats?.profitTargetProgress ?? 0);
              return (
                <div key={account.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{account.platform} / {account.server}</p>
                      <h3 className="mt-1 text-lg font-semibold">{account.login}</h3>
                    </div>
                    <Badge tone={statusTone(account.accountStatus)}>{account.accountStatus}</Badge>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">Challenge</span><strong className="block">{account.challenge.name}</strong></div>
                    <div><span className="text-slate-500">Equity</span><strong className="block">{currency(toNumber(account.equity))}</strong></div>
                    <div><span className="text-slate-500">Profit</span><strong className="block">{currency(toNumber(latestStats?.profit ?? 0))}</strong></div>
                    <div><span className="text-slate-500">Trades</span><strong className="block">{latestStats ? latestStats.openTrades + latestStats.closedTrades : 0}</strong></div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm"><span>Target progress</span><strong>{progress}%</strong></div>
                    <ProgressBar value={progress} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-[#f7fbff] shadow-sm dark:border-white/10 dark:bg-[#081936]">
        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Rank Up</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#061126] dark:text-white">Choose Your Challenge Route</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Compare account sizes, phase rules, and payout profiles before buying with your approved top-up balance.
              </p>
            </div>
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Approved top-up balance</span>
              <strong className="text-2xl text-[#061126] dark:text-white">{currency(topUpBalance)}</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Manual purchases use this balance only.</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="inline-flex justify-self-start rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              {rankPhases.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPhase(item.key)}
                  className={cn("h-10 rounded-md px-4 text-sm font-semibold transition", phase === item.key ? "bg-[#082f73] text-white shadow-sm" : "text-slate-500 hover:text-primary dark:text-slate-300")}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setView(view === "cards" ? "phases" : "cards")}
              className="inline-flex h-12 items-center justify-center gap-2 justify-self-end rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#061126] shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            >
              {view === "cards" ? <Eye className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}
              {view === "cards" ? "Phases" : "Cards"}
            </button>
          </div>

          {purchaseLocked ? (
            <div className="mt-6 rounded-lg border border-amber-300/70 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              {purchaseLockMessage}
            </div>
          ) : null}
        </div>

        <div className="p-5">
          {view === "cards" ? (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {visiblePrograms.length ? `Showing ${cardStart + 1}-${Math.min(cardStart + 4, visiblePrograms.length)} of ${visiblePrograms.length}` : "No programs in this route"}
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

              {carouselPrograms.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {carouselPrograms.map((program) => {
                    const featured = selectedProgram?.id === program.id;
                    const rewardEstimate = Math.round(toNumber(program.accountSize) * (rewardProfile.splitPercent / 100) * 0.0574);

                    return (
                      <article
                        key={program.id}
                        className={cn(
                          "relative flex min-h-[28rem] flex-col rounded-lg border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]",
                          featured
                            ? "border-[#082f73] bg-[#082f73] text-white shadow-[0_30px_80px_rgba(8,47,115,0.28)]"
                            : "border-slate-200 bg-white text-[#061126] dark:border-white/10 dark:bg-[#10203b] dark:text-white"
                        )}
                      >
                        {featured ? (
                          <span className="absolute left-1/2 top-0 inline-flex h-8 -translate-x-1/2 -translate-y-1/2 items-center rounded-md bg-[#3b6db7] px-4 text-[11px] font-bold uppercase text-white">
                            Selected
                          </span>
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={cn("text-xs font-bold uppercase", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>Account size</p>
                            <h3 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{currency(toNumber(program.accountSize))}</h3>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-xs font-bold uppercase", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>Price</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{currency(toNumber(program.price))}</p>
                          </div>
                        </div>

                        <Button
                          variant={featured ? "secondary" : "primary"}
                          className="mt-5 w-full rounded-md"
                          onClick={() => purchaseChallenge(program.id, selectedPaymentMethod === "crypto" ? "CRYPTO" : "TOPUP_BALANCE")}
                          disabled={purchasingId === program.id || purchaseLocked}
                        >
                          {purchasingId === program.id ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedPaymentMethod === "crypto" ? <Wallet className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          {purchaseLocked ? "Challenge Active" : selectedPaymentMethod === "crypto" ? "Open Crypto Checkout" : "Buy with Top-up Balance"}
                        </Button>

                        <button
                          type="button"
                          onClick={() => setSelectedProgramId(program.id)}
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
                          Estimated first reward <strong className={featured ? "text-white" : "text-[#061126] dark:text-white"}>{currency(rewardEstimate)}</strong>
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  No active challenge programs are available for this route yet.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                {visiblePrograms.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => setSelectedProgramId(program.id)}
                    className={cn("rounded-md px-4 py-2 text-sm font-semibold transition", selectedProgram?.id === program.id ? "bg-[#082f73] text-white shadow-sm" : "bg-white text-slate-500 hover:text-primary dark:bg-white/[0.06] dark:text-slate-300")}
                  >
                    {currency(toNumber(program.accountSize))}
                  </button>
                ))}
              </div>

              {selectedProgram ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="grid lg:grid-cols-[16rem_1fr_18rem]">
                    <div className="grid content-end gap-8 border-b border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] lg:border-b-0 lg:border-r">
                      <span className="inline-flex items-center gap-2"><Target className="h-4 w-4" /> Profit Target</span>
                      <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Max Loss</span>
                      <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Daily Drawdown</span>
                    </div>

                    <div className="p-6 lg:p-8">
                      <div className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Evaluation Stage</div>
                      <div className="mt-5 grid gap-5" style={{ gridTemplateColumns: `repeat(${phaseStepsFor(phase).length}, minmax(0, 1fr))` }}>
                        {phaseStepsFor(phase).map((step, index) => (
                          <div key={step} className="relative grid justify-items-center gap-4">
                            {index > 0 ? <span className="absolute right-1/2 top-9 h-[2px] w-full bg-slate-200 dark:bg-white/10" /> : null}
                            <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-slate-200 text-xl font-semibold text-[#061126] dark:bg-white/10 dark:text-white">
                              {step === "Master" || step === "Funded" ? <Crown className="h-6 w-6 text-warning" /> : index + 1}
                            </span>
                            <h3 className="text-xl font-semibold text-[#061126] dark:text-white">{step}</h3>
                            <div className="grid gap-8 text-center text-lg font-semibold text-[#061126] dark:text-white">
                              <span>{step === "Phase 2" ? phaseTarget(selectedProgram, phase, 2) : step === "Master" || step === "Funded" ? "-" : phaseTarget(selectedProgram, phase, 1)}</span>
                              <span>{selectedProgram.maxDrawdownPercent}%</span>
                              <span>{selectedProgram.dailyDrawdownPercent}%</span>
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
                        <span>{selectedProgram.maxDrawdownPercent}%</span>
                        <span>{selectedProgram.dailyDrawdownPercent}%</span>
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
                    <div className="grid gap-2 rounded-md bg-slate-50 p-4 dark:bg-slate-950/30 sm:grid-cols-3 sm:items-end">
                      <span>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-200">Account size</span>
                        <strong className="text-2xl text-slate-950 dark:text-white">{currency(toNumber(selectedProgram.accountSize))}</strong>
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-200">Price</span>
                        <strong className="text-2xl text-slate-950 dark:text-white">{currency(toNumber(selectedProgram.price))}</strong>
                      </span>
                      <Button className="w-full rounded-md" onClick={() => purchaseChallenge(selectedProgram.id, selectedPaymentMethod === "crypto" ? "CRYPTO" : "TOPUP_BALANCE")} disabled={purchasingId === selectedProgram.id || purchaseLocked}>
                        {purchasingId === selectedProgram.id ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedPaymentMethod === "crypto" ? <Wallet className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        {purchaseLocked ? "Active" : selectedPaymentMethod === "crypto" ? "Pay Crypto" : "Buy"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  No phase board is available for this route yet.
                </div>
              )}
            </>
          )}

          <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] lg:grid-cols-[1fr_20rem]">
            <div className="grid gap-3 sm:grid-cols-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={!method.enabled || purchaseLocked}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55",
                      selectedPaymentMethod === method.id
                        ? "border-primary bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mt-3 block text-sm font-bold">{method.label}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{method.status}</span>
                  </button>
                );
              })}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-[#061126] dark:text-white">
              Coupon code
              <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Optional" disabled={purchaseLocked} />
            </label>
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 md:grid-cols-3">
            <span className="inline-flex items-center gap-2"><Route className="h-4 w-4 text-primary" /> {rankPhases.find((item) => item.key === phase)?.title}</span>
            <span className="inline-flex items-center gap-2"><Layers3 className="h-4 w-4 text-primary" /> {rewardProfile.description}</span>
            <span className="inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Pricing, phase rules, and account sizes stay aligned with challenge data.</span>
          </div>
        </div>
      </section>

      {cryptoCheckout ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4 md:items-center">
          <div className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#07152d] sm:rounded-lg">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10 sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase text-primary">NOWPayments checkout</p>
                <h2 className="mt-1 text-xl font-semibold">{cryptoCheckout.order.challenge.name}</h2>
              </div>
              <Badge tone={statusTone(cryptoCheckout.status)}>{cryptoCheckout.status}</Badge>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Challenge price</span>
                  <strong>{currency(toNumber(cryptoCheckout.priceAmount ?? cryptoCheckout.order.total))}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Pay exact amount</span>
                  <strong>
                    {cryptoCheckout.payAmount ?? "-"} {cryptoCheckout.payCurrency?.toUpperCase() ?? ""}
                  </strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <Badge tone={statusTone(cryptoCheckout.status)}>{cryptoCheckout.status}</Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                  <span className="text-sm font-semibold">Payment address</span>
                  <button
                    type="button"
                    onClick={copyPaymentAddress}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="min-w-0 break-all font-mono text-xs">{cryptoCheckout.payAddress ?? "Address unavailable"}</span>
                    <Copy className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                  <div className="rounded-md border border-amber-300/40 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                    Only cancel if you have not sent the payment. If you already paid, use Check payment and wait for provider confirmation.
                  </div>
                </div>
                {cryptoCheckout.payAddress ? (
                  <QrCodeCard
                    title={`${cryptoCheckout.payCurrency?.toUpperCase() ?? "Crypto"} address`}
                    value={cryptoCheckout.payAddress}
                    fileName={`pipnest-${cryptoCheckout.paymentId}-crypto-qr.png`}
                    shareText="PipNest Markets crypto payment address"
                  />
                ) : null}
              </div>

              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                Send the exact crypto amount to this address. After payment, click check status. The challenge will show as paid automatically when NOWPayments confirms it.
              </p>

              <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#07152d] sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:p-5">
                <Button type="button" variant="danger" onClick={() => setConfirmCancelCheckout(true)}>
                  Cancel checkout
                </Button>
                <Button type="button" onClick={checkCryptoPayment} disabled={checkingPayment}>
                  {checkingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  Check payment
                </Button>
              </div>
            </div>
          </div>
          {confirmCancelCheckout ? (
            <div className="fixed inset-0 z-[120] grid place-items-end bg-slate-950/75 p-3 backdrop-blur-sm sm:place-items-center sm:p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-slate-900 sm:rounded-lg">
                <h3 className="text-lg font-semibold">Cancel crypto checkout?</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  If you have not sent crypto, you can cancel this checkout now. If payment was already sent, do not cancel. Use Check payment and wait for confirmation.
                </p>
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setConfirmCancelCheckout(false)} disabled={cancellingPayment}>
                    Keep checkout
                  </Button>
                  <Button type="button" variant="danger" onClick={cancelCryptoCheckout} disabled={cancellingPayment}>
                    {cancellingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Yes, cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="font-semibold">Order History</h2>
        <div className="mt-4 grid gap-3">
          {visibleOrders.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">No challenge orders yet.</div>
          ) : (
            visibleOrders.slice(0, 8).map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <div>
                  <div className="font-semibold">{order.challenge.name}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.orderNumber} / {formatDate(order.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{currency(toNumber(order.total))}</span>
                  <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
