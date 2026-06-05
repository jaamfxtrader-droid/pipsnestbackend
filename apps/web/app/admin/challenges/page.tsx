"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  XCircle
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type Challenge = {
  id: string;
  name: string;
  slug: string;
  description: string;
  accountSize: string | number;
  price: string | number;
  profitTargetPercent: number;
  dailyDrawdownPercent: number;
  maxDrawdownPercent: number;
  minTradingDays: number;
  leverage: string;
  phaseCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "FAILED" | "REFUNDED";

type AdminOrder = {
  id: string;
  orderNumber: string;
  amount: string | number;
  discount: string | number;
  total: string | number;
  status: OrderStatus;
  createdAt: string;
  user: Pick<AuthUser, "id" | "name" | "email" | "phone">;
  challenge: Challenge;
  payments: Array<{ id: string; provider: string; status: string; amount: string | number }>;
};

const emptyChallengeForm = {
  name: "",
  description: "",
  accountSize: "10000",
  price: "99",
  profitTargetPercent: "8",
  dailyDrawdownPercent: "5",
  maxDrawdownPercent: "10",
  minTradingDays: "5",
  leverage: "1:100",
  phaseCount: "2",
  sortOrder: "0",
  isActive: true
};

function toNumber(value: string | number) {
  return Number(value ?? 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function orderTone(status: OrderStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "PAID") return "profit";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED" || status === "FAILED" || status === "REFUNDED") return "loss";
  return "neutral";
}

export default function ChallengeManagementPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [form, setForm] = useState(emptyChallengeForm);
  const [loading, setLoading] = useState(true);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [challengePage, setChallengePage] = useState(1);
  const [deleteChallengeTarget, setDeleteChallengeTarget] = useState<Challenge | null>(null);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [challengeData, orderData] = await Promise.all([
        apiFetch<{ challenges: Challenge[] }>("/admin/challenges", { token: authToken }),
        apiFetch<{ orders: AdminOrder[] }>("/admin/orders", { token: authToken })
      ]);
      setChallenges(challengeData.challenges);
      setOrders(orderData.orders);
      setSelectedChallengeId((current) => current || challengeData.challenges[0]?.id || "");
      setSelectedOrderId((current) => current || orderData.orders[0]?.id || "");
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
    if (scope !== "admin" || !token) return;
    loadData(token);
  }, [scope, token]);

  const selectedChallenge = useMemo(() => challenges.find((challenge) => challenge.id === selectedChallengeId), [challenges, selectedChallengeId]);
  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) ?? orders[0], [orders, selectedOrderId]);
  const activeChallenges = useMemo(() => challenges.filter((challenge) => challenge.isActive).length, [challenges]);
  const paidOrders = useMemo(() => orders.filter((order) => order.status === "PAID").length, [orders]);
  const revenue = useMemo(() => orders.filter((order) => order.status === "PAID").reduce((sum, order) => sum + toNumber(order.total), 0), [orders]);
  const challengePageSize = 6;
  const totalChallengePages = Math.max(1, Math.ceil(challenges.length / challengePageSize));
  const pagedChallenges = useMemo(
    () => challenges.slice((challengePage - 1) * challengePageSize, challengePage * challengePageSize),
    [challengePage, challenges]
  );

  useEffect(() => {
    setChallengePage((current) => Math.min(current, totalChallengePages));
  }, [totalChallengePages]);

  useEffect(() => {
    if (!selectedChallenge) return;
    setForm({
      name: selectedChallenge.name,
      description: selectedChallenge.description,
      accountSize: String(selectedChallenge.accountSize),
      price: String(selectedChallenge.price),
      profitTargetPercent: String(selectedChallenge.profitTargetPercent),
      dailyDrawdownPercent: String(selectedChallenge.dailyDrawdownPercent),
      maxDrawdownPercent: String(selectedChallenge.maxDrawdownPercent),
      minTradingDays: String(selectedChallenge.minTradingDays),
      leverage: selectedChallenge.leverage,
      phaseCount: String(selectedChallenge.phaseCount),
      sortOrder: String(selectedChallenge.sortOrder ?? 0),
      isActive: selectedChallenge.isActive
    });
  }, [selectedChallenge]);

  function resetForm() {
    setSelectedChallengeId("");
    setForm(emptyChallengeForm);
  }

  async function saveChallenge() {
    if (!token) return;
    setSavingChallenge(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        accountSize: Number(form.accountSize),
        price: Number(form.price),
        profitTargetPercent: Number(form.profitTargetPercent),
        dailyDrawdownPercent: Number(form.dailyDrawdownPercent),
        maxDrawdownPercent: Number(form.maxDrawdownPercent),
        minTradingDays: Number(form.minTradingDays),
        leverage: form.leverage,
        phaseCount: Number(form.phaseCount),
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive
      };
      const data = await apiFetch<{ challenge: Challenge }>(selectedChallengeId ? `/admin/challenges/${selectedChallengeId}` : "/admin/challenges", {
        method: selectedChallengeId ? "PUT" : "POST",
        token,
        body: JSON.stringify(payload)
      });
      setChallenges((current) => {
        if (selectedChallengeId) return current.map((challenge) => (challenge.id === selectedChallengeId ? data.challenge : challenge));
        return [...current, data.challenge].sort((left, right) => left.sortOrder - right.sortOrder || toNumber(left.accountSize) - toNumber(right.accountSize));
      });
      setSelectedChallengeId(data.challenge.id);
      pushToast({ title: "Challenge saved", message: `${data.challenge.name} is connected to landing and trader dashboard cards.`, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Challenge not saved",
        message: error instanceof Error ? error.message : "Please check all challenge fields.",
        tone: "error"
      });
    } finally {
      setSavingChallenge(false);
    }
  }

  async function deleteChallenge(challenge: Challenge) {
    if (!token) return;
    setSavingChallenge(true);
    try {
      const data = await apiFetch<{ challenge?: Challenge; message?: string }>(`/admin/challenges/${challenge.id}`, {
        method: "DELETE",
        token
      });
      if (data.challenge) {
        setChallenges((current) => current.map((item) => (item.id === challenge.id ? data.challenge! : item)));
        pushToast({ title: "Challenge hidden", message: data.message ?? `${data.challenge.name} is hidden from user-facing cards.`, tone: "success" });
      } else {
        setChallenges((current) => current.filter((item) => item.id !== challenge.id));
        setSelectedChallengeId((current) => (current === challenge.id ? "" : current));
        pushToast({ title: "Challenge deleted", message: data.message ?? `${challenge.name} was deleted.`, tone: "success" });
      }
      setDeleteChallengeTarget(null);
    } catch (error) {
      pushToast({
        title: "Challenge not deleted",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSavingChallenge(false);
    }
  }

  async function updateOrderStatus(status: OrderStatus) {
    if (!token || !selectedOrder) return;
    setSavingOrder(true);
    try {
      const data = await apiFetch<{ order: AdminOrder; message: string }>(`/admin/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        token,
        body: JSON.stringify({ status })
      });
      setOrders((current) => current.map((order) => (order.id === selectedOrder.id ? { ...order, ...data.order } : order)));
      pushToast({ title: "Order updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Order not updated",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Challenges & Orders"
        description="Create DB-driven challenge cards and review trader challenge purchases in one admin workspace."
        action={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <Button type="button" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              New Challenge
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Active cards</div>
          <div className="mt-3 text-3xl font-black">{activeChallenges}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total challenges</div>
          <div className="mt-3 text-3xl font-black">{challenges.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Paid orders</div>
          <div className="mt-3 text-3xl font-black">{paidOrders}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Challenge revenue</div>
          <div className="mt-3 text-3xl font-black">{currency(revenue)}</div>
        </div>
      </section>

      <div className="mt-6 grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <section className="grid min-w-0 content-start gap-5 self-start">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">User-facing challenge cards</h2>
          </div>
          <div className="grid min-w-0 auto-rows-fr gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">Loading challenge cards...</div>
            ) : challenges.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">No challenge cards yet.</div>
            ) : (
              pagedChallenges.map((challenge) => {
                const selected = selectedChallengeId === challenge.id;
                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => setSelectedChallengeId(challenge.id)}
                    className={cn(
                      "min-w-0 overflow-hidden rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
                      selected
                        ? "border-primary/45 bg-primary/10 dark:bg-primary/15"
                        : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge tone={challenge.isActive ? "profit" : "neutral"}>{challenge.isActive ? "Live" : "Hidden"}</Badge>
                        <h3 className="mt-3 line-clamp-2 break-words text-lg font-semibold leading-7">{challenge.name}</h3>
                      </div>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">Sort {challenge.sortOrder}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                      {challenge.description}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="min-w-0 rounded-md bg-slate-100 p-3 dark:bg-white/10">
                        <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Account size</p>
                        <p className="mt-1 break-words text-lg font-semibold [overflow-wrap:anywhere]">{currency(challenge.accountSize)}</p>
                      </div>
                      <div className="min-w-0 rounded-md bg-slate-100 p-3 dark:bg-white/10">
                        <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Price</p>
                        <p className="mt-1 break-words text-lg font-semibold [overflow-wrap:anywhere]">{currency(challenge.price)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {challenge.phaseCount <= 0 ? (
                        <div className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          Real Account
                          <span className="mt-1 block text-slate-500">Funded review</span>
                        </div>
                      ) : (
                        Array.from({ length: challenge.phaseCount }).map((_, index) => (
                          <div key={`${challenge.id}-phase-${index}`} className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            Phase {index + 1}
                            <span className="mt-1 block text-slate-500">{index + 1 === challenge.phaseCount ? "Master review" : "Evaluation"}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {[
                        ["Profit target", `${challenge.profitTargetPercent}%`],
                        ["Daily drawdown", `${challenge.dailyDrawdownPercent}%`],
                        ["Max drawdown", `${challenge.maxDrawdownPercent}%`],
                        ["Leverage", challenge.leverage]
                      ].map(([label, value]) => (
                        <span key={label} className="min-w-0 rounded-md bg-slate-100 p-2 dark:bg-white/10">
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{label}</span>
                          <strong className="mt-1 block break-words [overflow-wrap:anywhere]">{value}</strong>
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {challenges.length > challengePageSize ? (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Showing {(challengePage - 1) * challengePageSize + 1}-{Math.min(challengePage * challengePageSize, challenges.length)} of {challenges.length}
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" onClick={() => setChallengePage((page) => Math.max(1, page - 1))} disabled={challengePage === 1}>
                  Previous
                </Button>
                <span className="rounded-md bg-slate-100 px-3 py-2 font-semibold dark:bg-white/10">{challengePage} / {totalChallengePages}</span>
                <Button type="button" variant="secondary" onClick={() => setChallengePage((page) => Math.min(totalChallengePages, page + 1))} disabled={challengePage === totalChallengePages}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 self-start rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] xl:sticky xl:top-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
              <Layers3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">{selectedChallengeId ? "Edit challenge card" : "New challenge card"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Saved cards power landing and trader dashboard pricing.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Name
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Growth Challenge" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="min-h-[6rem] rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                placeholder="Describe this challenge route"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Account size
                <Input value={form.accountSize} onChange={(event) => setForm((current) => ({ ...current, accountSize: event.target.value.replace(/[^\d.]/g, "") }))} inputMode="decimal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Price
                <Input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value.replace(/[^\d.]/g, "") }))} inputMode="decimal" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                Profit %
                <Input value={form.profitTargetPercent} onChange={(event) => setForm((current) => ({ ...current, profitTargetPercent: event.target.value.replace(/[^\d.]/g, "") }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Daily DD %
                <Input value={form.dailyDrawdownPercent} onChange={(event) => setForm((current) => ({ ...current, dailyDrawdownPercent: event.target.value.replace(/[^\d.]/g, "") }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Max DD %
                <Input value={form.maxDrawdownPercent} onChange={(event) => setForm((current) => ({ ...current, maxDrawdownPercent: event.target.value.replace(/[^\d.]/g, "") }))} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                Min days
                <Input value={form.minTradingDays} onChange={(event) => setForm((current) => ({ ...current, minTradingDays: event.target.value.replace(/[^\d]/g, "") }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Phases
                <Input value={form.phaseCount} onChange={(event) => setForm((current) => ({ ...current, phaseCount: event.target.value.replace(/[^\d]/g, "") }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Sort
                <Input value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value.replace(/[^\d-]/g, "") }))} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Leverage
              <Input value={form.leverage} onChange={(event) => setForm((current) => ({ ...current, leverage: event.target.value }))} placeholder="1:100" />
            </label>
            <SwitchField
              checked={form.isActive}
              onChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
              label="Live on user cards"
              description={form.isActive ? "Visible on landing and trader dashboard" : "Hidden from user-facing challenge cards"}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" onClick={saveChallenge} disabled={savingChallenge || !form.name || form.description.length < 10}>
                {savingChallenge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
              {selectedChallenge ? (
                <Button type="button" variant="danger" onClick={() => setDeleteChallengeTarget(selectedChallenge)} disabled={savingChallenge}>
                  {savingChallenge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Challenge Orders</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Trader challenge purchases, coupon discounts, and payment status from the database.</p>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 items-start gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Trader</th>
                  <th className="px-4 py-3 font-semibold">Challenge</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No challenge orders yet.</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={cn("cursor-pointer transition hover:bg-slate-50 dark:hover:bg-white/[0.04]", selectedOrder?.id === order.id && "bg-primary/5 dark:bg-primary/10")}
                    >
                      <td className="px-4 py-4 font-semibold">{order.orderNumber}</td>
                      <td className="px-4 py-4">
                        <span className="block font-semibold">{order.user.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{order.user.email}</span>
                      </td>
                      <td className="px-4 py-4">{order.challenge.name}</td>
                      <td className="px-4 py-4 font-semibold">{currency(order.total)}</td>
                      <td className="px-4 py-4">{currency(order.discount)}</td>
                      <td className="px-4 py-4"><Badge tone={orderTone(order.status)}>{order.status}</Badge></td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          <aside className="min-w-0 self-start rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            {selectedOrder ? (
              <div className="grid gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">{selectedOrder.orderNumber}</h3>
                    <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{selectedOrder.user.name}</p>
                  </div>
                  <Badge tone={orderTone(selectedOrder.status)} className="shrink-0">{selectedOrder.status}</Badge>
                </div>
                <div className="grid gap-3 text-sm">
                  <span className="flex justify-between gap-3"><span className="text-slate-500">Challenge</span><strong className="text-right [overflow-wrap:anywhere]">{selectedOrder.challenge.name}</strong></span>
                  <span className="flex justify-between gap-3"><span className="text-slate-500">Subtotal</span><strong>{currency(selectedOrder.amount)}</strong></span>
                  <span className="flex justify-between gap-3"><span className="text-slate-500">Discount</span><strong>{currency(selectedOrder.discount)}</strong></span>
                  <span className="flex justify-between gap-3"><span className="text-slate-500">Total</span><strong>{currency(selectedOrder.total)}</strong></span>
                </div>
                <div className="rounded-md bg-white p-3 text-sm dark:bg-slate-950">
                  <div className="mb-2 font-semibold">Payments</div>
                  {selectedOrder.payments.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No payment records.</p>
                  ) : (
                    <div className="grid gap-2">
                      {selectedOrder.payments.map((payment) => (
                        <div key={payment.id} className="flex min-w-0 items-center justify-between gap-3">
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{payment.provider}</span>
                          <Badge tone={payment.status === "SUCCEEDED" ? "profit" : payment.status === "PENDING" ? "warning" : "loss"} className="shrink-0">{payment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {(["PENDING", "PAID", "CANCELLED", "FAILED", "REFUNDED"] as OrderStatus[]).map((status) => {
                    const Icon = status === "PAID" ? CheckCircle2 : status === "PENDING" ? Clock3 : XCircle;
                    return (
                      <Button
                        key={status}
                        type="button"
                        variant={status === "PAID" ? "primary" : status === "PENDING" ? "secondary" : "danger"}
                        onClick={() => updateOrderStatus(status)}
                        disabled={savingOrder || selectedOrder.status === status}
                        className="min-w-0"
                      >
                        {savingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                        <span className="truncate">Mark {status}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid min-h-[20rem] place-items-center text-center text-sm text-slate-500 dark:text-slate-400">
                Select an order to review.
              </div>
            )}
          </aside>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteChallengeTarget)}
        title="Delete challenge?"
        description={
          deleteChallengeTarget
            ? `${deleteChallengeTarget.name} will be deleted if it has no linked orders or trading accounts. If records exist, it will be hidden from user-facing cards to keep old data safe.`
            : ""
        }
        confirmLabel="Delete Challenge"
        loading={savingChallenge}
        onClose={() => setDeleteChallengeTarget(null)}
        onConfirm={() => {
          if (deleteChallengeTarget) void deleteChallenge(deleteChallengeTarget);
        }}
      />
    </>
  );
}
