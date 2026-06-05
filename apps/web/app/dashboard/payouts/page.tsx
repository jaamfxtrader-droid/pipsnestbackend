"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Clock3, Coins, CreditCard, FileText, Landmark, Loader2, ReceiptText, Send, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDataTable } from "@/components/ui/data-table-client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type PayoutAccount = {
  id: string;
  login: string;
  platform: "MT4" | "MT5";
  server: string;
  status: string;
  challengeName: string;
  accountSize: number;
  balance: number;
  equity: number;
  grossProfit: number;
  pendingPayouts: number;
  availableBalance: number;
};

type PayoutHistory = {
  id: string;
  amount: number;
  method: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  adminNote: string | null;
  tradingAccount: {
    id: string;
    login: string;
    platform: "MT4" | "MT5";
  } | null;
};

type LedgerEntry = {
  id: string;
  reference: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  status: string;
  date: string;
  details: string;
};

type PayoutOverview = {
  availableBalance: number;
  pendingPayouts: number;
  paidPayouts: number;
  payoutHoldUntil: string | null;
  accounts: PayoutAccount[];
  payouts: PayoutHistory[];
  ledger: LedgerEntry[];
};

const emptyOverview: PayoutOverview = {
  availableBalance: 0,
  pendingPayouts: 0,
  paidPayouts: 0,
  payoutHoldUntil: null,
  accounts: [],
  payouts: [],
  ledger: []
};

const payoutMethods = [
  { id: "MANUAL", label: "Manual", status: "Active", icon: FileText, enabled: true },
  { id: "BANK", label: "Bank", status: "Gateway pending", icon: Landmark, enabled: false },
  { id: "CRYPTO", label: "Crypto", status: "Gateway pending", icon: Coins, enabled: false },
  { id: "CARD", label: "Card", status: "Gateway pending", icon: CreditCard, enabled: false }
] as const;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusTone(status: string): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (["PAID", "SUCCEEDED", "APPROVED", "ACTIVE"].includes(status)) return "profit";
  if (["PENDING"].includes(status)) return "warning";
  if (["FAILED", "REJECTED", "CANCELLED", "REFUNDED"].includes(status)) return "loss";
  return "neutral";
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Wallet;
  tone: "primary" | "profit" | "warning";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300",
    profit: "bg-profit/10 text-green-700 dark:bg-profit/15 dark:text-green-300",
    warning: "bg-warning/15 text-amber-700 dark:bg-warning/15 dark:text-amber-300"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("grid h-10 w-10 place-items-center rounded-md", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-right text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      </div>
      <div className="mt-5 text-2xl font-black">{value}</div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export default function PayoutRequestsPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [overview, setOverview] = useState<PayoutOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    amount: "",
    tradingAccountId: "",
    method: "MANUAL",
    details: ""
  });

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  async function loadOverview(authToken = token) {
    if (!authToken) return;
    setLoading(true);

    try {
      const data = await apiFetch<PayoutOverview>("/payouts/overview", { token: authToken });
      setOverview(data);
    } catch (error) {
      pushToast({
        title: "Payout data not loaded",
        message: error instanceof Error ? error.message : "Please refresh and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope !== "user" || !token) return;
    loadOverview(token);
  }, [scope, token]);

  const selectedAccount = useMemo(
    () => overview.accounts.find((account) => account.id === requestForm.tradingAccountId),
    [overview.accounts, requestForm.tradingAccountId]
  );
  const selectedAvailableBalance = selectedAccount?.availableBalance ?? overview.availableBalance;
  const payoutLocked = overview.payoutHoldUntil ? new Date(overview.payoutHoldUntil) > new Date() : false;

  async function requestPayout() {
    if (!token) return;
    const amount = Number(requestForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      pushToast({ title: "Invalid amount", message: "Enter a valid payout amount.", tone: "error" });
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch<{ payout: PayoutHistory }>("/payouts/request", {
        method: "POST",
        token,
        body: JSON.stringify({
          amount,
          method: "MANUAL",
          tradingAccountId: requestForm.tradingAccountId || undefined,
          bankDetails: requestForm.details
        })
      });
      setRequestForm({ amount: "", tradingAccountId: "", method: "MANUAL", details: "" });
      pushToast({ title: "Payout requested", message: "Your manual payout request is now pending review.", tone: "success" });
      await loadOverview(token);
    } catch (error) {
      pushToast({
        title: "Payout not requested",
        message: error instanceof Error ? error.message : "Please check the amount and try again.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Payouts & Ledger" description="Withdrawable balance, manual payouts, payout status, and transaction ledger." />

      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard label="Available" value={formatMoney(overview.availableBalance)} detail="Withdrawable profit after pending payouts" icon={Wallet} tone="profit" />
        <SummaryCard label="Pending" value={formatMoney(overview.pendingPayouts)} detail="Requests waiting for admin action" icon={Clock3} tone="warning" />
        <SummaryCard label="Paid" value={formatMoney(overview.paidPayouts)} detail="Completed payouts on your account" icon={CheckCircle2} tone="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Request Payout</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Available now: {formatMoney(selectedAvailableBalance)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {payoutMethods.map((method) => {
                const Icon = method.icon;
                const active = requestForm.method === method.id;

                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={!method.enabled}
                    onClick={() => setRequestForm((current) => ({ ...current, method: method.id }))}
                    className={cn(
                      "rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55",
                      active
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Amount
                <span className="relative">
                  <CircleDollarSign className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    type="number"
                    min="1"
                    step="0.01"
                    value={requestForm.amount}
                    onChange={(event) => setRequestForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="0.00"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Trading account
                <Select
                  value={requestForm.tradingAccountId}
                  onChange={(event) => setRequestForm((current) => ({ ...current, tradingAccountId: event.target.value }))}
                >
                  <option value="">Total available balance</option>
                  {overview.accounts.map((account) => (
                    <option key={account.id} value={account.id} disabled={account.availableBalance <= 0}>
                      {account.platform} {account.login} - {formatMoney(account.availableBalance)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Manual payout details
              <textarea
                className="min-h-28 rounded-md border border-slate-300/30 bg-white p-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                value={requestForm.details}
                onChange={(event) => setRequestForm((current) => ({ ...current, details: event.target.value }))}
                placeholder="Bank title, account/IBAN, wallet address, or admin note"
              />
            </label>

            {payoutLocked ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                Payouts unlock on {formatDate(overview.payoutHoldUntil)}.
              </div>
            ) : null}

            <Button
              type="button"
              onClick={requestPayout}
              disabled={!token || submitting || loading || payoutLocked || selectedAvailableBalance <= 0}
              className="w-full sm:w-fit"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Manual Payout
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-profit/10 text-green-700 dark:bg-profit/15 dark:text-green-300">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Eligible Accounts</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{overview.accounts.length} trading accounts found</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">Loading accounts...</div>
            ) : overview.accounts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">No trading accounts yet.</div>
            ) : (
              overview.accounts.map((account) => (
                <div key={account.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {account.platform} {account.login}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{account.challengeName}</div>
                    </div>
                    <Badge tone={account.availableBalance > 0 ? "profit" : "neutral"}>{account.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">Equity</span>
                      <span className="font-semibold">{formatMoney(account.equity)}</span>
                    </span>
                    <span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">Available</span>
                      <span className="font-semibold">{formatMoney(account.availableBalance)}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Payout History</h2>
        </div>
        <ClientDataTable
          data={overview.payouts}
          loading={loading}
          pageSize={5}
          empty="No payout requests found."
          columns={[
            { header: "Reference", cell: (row) => <span className="font-mono text-xs">{row.id.slice(-10)}</span> },
            { header: "Account", cell: (row) => row.tradingAccount ? `${row.tradingAccount.platform} ${row.tradingAccount.login}` : "General balance" },
            { header: "Method", cell: (row) => row.method },
            { header: "Amount", cell: (row) => formatMoney(row.amount) },
            { header: "Date", cell: (row) => formatDate(row.requestedAt) },
            { header: "Status", cell: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }
          ]}
        />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Transaction Ledger</h2>
        </div>
        <ClientDataTable
          data={overview.ledger}
          loading={loading}
          pageSize={8}
          empty="No ledger records found."
          columns={[
            { header: "Reference", cell: (row) => <span className="font-mono text-xs">{row.reference}</span> },
            { header: "Type", cell: (row) => row.type },
            {
              header: "Direction",
              cell: (row) => <Badge tone={row.direction === "CREDIT" ? "profit" : "neutral"}>{row.direction}</Badge>
            },
            { header: "Amount", cell: (row) => formatMoney(row.amount) },
            { header: "Date", cell: (row) => formatDate(row.date) },
            { header: "Status", cell: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }
          ]}
        />
      </section>
    </>
  );
}
