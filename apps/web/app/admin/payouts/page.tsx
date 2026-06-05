"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, Clock3, CreditCard, Loader2, RefreshCw, Wallet, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type PayoutStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED" | "CANCELLED";
type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

type TradingAccount = {
  id: string;
  login: string;
  platform: "MT4" | "MT5";
  server: string;
  challenge?: { name: string } | null;
};

type AdminPayout = {
  id: string;
  amount: string | number;
  method: string;
  walletAddress?: string | null;
  bankDetails?: string | null;
  status: PayoutStatus;
  adminNote?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  user: Pick<AuthUser, "id" | "name" | "email" | "phone">;
  tradingAccount?: TradingAccount | null;
};

type AdminPayment = {
  id: string;
  provider: string;
  providerPaymentId?: string | null;
  amount: string | number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  user: Pick<AuthUser, "id" | "name" | "email">;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    challenge?: { name: string } | null;
  } | null;
};

function payoutTone(status: PayoutStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "PAID") return "profit";
  if (status === "APPROVED" || status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "CANCELLED") return "loss";
  return "neutral";
}

function paymentTone(status: PaymentStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "SUCCEEDED") return "profit";
  if (status === "PENDING") return "warning";
  if (status === "FAILED" || status === "REFUNDED") return "loss";
  return "neutral";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminFinancePage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [selectedPayoutId, setSelectedPayoutId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [view, setView] = useState<"payouts" | "payments">("payouts");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [payoutData, paymentData] = await Promise.all([
        apiFetch<{ payouts: AdminPayout[] }>("/admin/payouts", { token: authToken }),
        apiFetch<{ payments: AdminPayment[] }>("/admin/payments", { token: authToken })
      ]);
      setPayouts(payoutData.payouts);
      setPayments(paymentData.payments);
      setSelectedPayoutId((current) => current || payoutData.payouts[0]?.id || "");
    } catch (error) {
      pushToast({
        title: "Finance data not loaded",
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

  const selectedPayout = useMemo(() => payouts.find((payout) => payout.id === selectedPayoutId) ?? payouts[0], [payouts, selectedPayoutId]);
  const pendingPayoutAmount = useMemo(
    () => payouts.filter((payout) => payout.status === "PENDING" || payout.status === "APPROVED").reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0),
    [payouts]
  );
  const paidPayoutAmount = useMemo(
    () => payouts.filter((payout) => payout.status === "PAID").reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0),
    [payouts]
  );
  const successfulPayments = useMemo(
    () => payments.filter((payment) => payment.status === "SUCCEEDED").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [payments]
  );

  useEffect(() => {
    setAdminNote(selectedPayout?.adminNote ?? "");
  }, [selectedPayout?.id, selectedPayout?.adminNote]);

  async function updatePayoutStatus(status: PayoutStatus) {
    if (!token || !selectedPayout) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ payout: AdminPayout }>(`/admin/payouts/${selectedPayout.id}/status`, {
        method: "PUT",
        token,
        body: JSON.stringify({ status, adminNote })
      });
      setPayouts((current) => current.map((payout) => (payout.id === selectedPayout.id ? { ...payout, ...data.payout } : payout)));
      pushToast({ title: "Payout updated", message: `Payout is now ${status.toLowerCase()}.`, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Payout not updated",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Finance Management"
        description="Review payout requests and payment records from live database data."
        action={
          <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Pending payouts</div>
          <div className="mt-3 text-3xl font-black">{currency(pendingPayoutAmount)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Paid payouts</div>
          <div className="mt-3 text-3xl font-black">{currency(paidPayoutAmount)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Successful payments</div>
          <div className="mt-3 text-3xl font-black">{currency(successfulPayments)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Records</div>
          <div className="mt-3 text-3xl font-black">{payouts.length + payments.length}</div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 grid grid-cols-2 gap-2">
            {[
              { id: "payouts", label: "Payouts", Icon: Wallet },
              { id: "payments", label: "Payments", Icon: CreditCard }
            ].map((item) => {
              const Icon = item.Icon;
              const selected = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id as "payouts" | "payments")}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition",
                    selected ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:text-primary dark:bg-white/10 dark:text-slate-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {view === "payouts" ? (
            <div className="grid max-h-[760px] gap-2 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading payouts...</div>
              ) : payouts.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">No payout requests yet.</div>
              ) : (
                payouts.map((payout) => (
                  <button
                    key={payout.id}
                    type="button"
                    onClick={() => setSelectedPayoutId(payout.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition",
                      selectedPayout?.id === payout.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-slate-200 bg-slate-50 hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{payout.user.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{currency(payout.amount)} / {payout.method}</div>
                      </div>
                      <Badge tone={payoutTone(payout.status)}>{payout.status}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(payout.requestedAt)}</div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid max-h-[760px] gap-2 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">No payment records yet.</div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{payment.user.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.provider} / {payment.order?.orderNumber ?? payment.id}</div>
                      </div>
                      <Badge tone={paymentTone(payment.status)}>{payment.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{currency(payment.amount)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(payment.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {selectedPayout ? (
            <>
              <div className="border-b border-slate-200 p-5 dark:border-white/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedPayout.user.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedPayout.user.email} / {selectedPayout.user.phone ?? "No phone"}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Requested {formatDate(selectedPayout.requestedAt)}</p>
                  </div>
                  <Badge tone={payoutTone(selectedPayout.status)}>{selectedPayout.status}</Badge>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Amount</div>
                    <p className="mt-2 text-lg font-semibold">{currency(selectedPayout.amount)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Method</div>
                    <p className="mt-2 text-lg font-semibold">{selectedPayout.method}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Processed</div>
                    <p className="mt-2 text-sm font-semibold">{formatDate(selectedPayout.processedAt)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Trading account</div>
                    <p className="mt-2 text-sm font-semibold">
                      {selectedPayout.tradingAccount
                        ? `${selectedPayout.tradingAccount.platform} ${selectedPayout.tradingAccount.login} / ${selectedPayout.tradingAccount.challenge?.name ?? selectedPayout.tradingAccount.server}`
                        : "General payout"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Destination</div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold">
                      {selectedPayout.walletAddress || selectedPayout.bankDetails || "No payout details provided"}
                    </p>
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-semibold">
                  Admin note
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={4}
                    className="min-h-[7rem] rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                    placeholder="Approval note, paid transaction ID, or rejection reason"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => updatePayoutStatus("PENDING")} disabled={saving || selectedPayout.status === "PENDING"}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                    Pending
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => updatePayoutStatus("APPROVED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button type="button" onClick={() => updatePayoutStatus("PAID")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                    Mark Paid
                  </Button>
                  <Button type="button" variant="danger" onClick={() => updatePayoutStatus("REJECTED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                  <Button type="button" variant="danger" onClick={() => updatePayoutStatus("CANCELLED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[28rem] place-items-center p-8 text-center text-slate-500 dark:text-slate-400">
              Select a payout request to review.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
