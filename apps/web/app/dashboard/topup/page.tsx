"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Copy, CreditCard, ImageIcon, Landmark, Loader2, Paperclip, ShieldCheck, UploadCloud, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCodeCard } from "@/components/ui/qr-code-card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type TopUpStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type TopUpMethod = "MANUAL" | "BANK" | "CRYPTO" | "CARD";

type LedgerItem = {
  id: string;
  reference: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  method: string;
  status: string;
  date: string;
  details: string;
  receiptUrl?: string | null;
};

type TopUpOverview = {
  balance: number;
  pendingAmount: number;
  approvedAmount: number;
  spentAmount: number;
  ledger: LedgerItem[];
  topUps: Array<{
    id: string;
    amount: string | number;
    method: TopUpMethod;
    status: TopUpStatus;
    reference?: string | null;
    transactionId?: string | null;
    proofUrl?: string | null;
    adminNote?: string | null;
    createdAt: string;
    manualFundingAccount?: ManualFundingAccount | null;
  }>;
};

type ManualFundingAccount = {
  id: string;
  label: string;
  accountType: "CRYPTO" | "BANK" | "WALLET";
  asset?: string | null;
  network?: string | null;
  accountIdentifier: string;
  holderName?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  processingTime?: string | null;
  minAmount: number | string;
  isActive: boolean;
};

type TopUpCryptoCheckout = {
  paymentId: string;
  status: string;
  payAddress?: string;
  payAmount?: number;
  payCurrency?: string;
  priceAmount?: number;
  priceCurrency?: string;
  topUp?: { id: string; amount: string | number; status: string } | null;
};

const methods = [
  { id: "MANUAL", label: "Manual", status: "Active", icon: ShieldCheck, enabled: true },
  { id: "BANK", label: "Bank", status: "Coming soon", icon: Landmark, enabled: false },
  { id: "CRYPTO", label: "Crypto", status: "NOWPayments", icon: Wallet, enabled: true },
  { id: "CARD", label: "Card", status: "Coming soon", icon: CreditCard, enabled: false }
] as const;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function statusTone(status: string): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (["APPROVED", "SUCCEEDED", "PAID"].includes(status)) return "profit";
  if (["PENDING"].includes(status)) return "warning";
  if (["REJECTED", "CANCELLED", "FAILED"].includes(status)) return "loss";
  return "neutral";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function instructionLines(value?: string | null) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export default function TopUpPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [overview, setOverview] = useState<TopUpOverview | null>(null);
  const [manualAccounts, setManualAccounts] = useState<ManualFundingAccount[]>([]);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<TopUpMethod | "">("");
  const [selectedManualAccountId, setSelectedManualAccountId] = useState("");
  const [cryptoCheckout, setCryptoCheckout] = useState<TopUpCryptoCheckout | null>(null);
  const [confirmCancelCheckout, setConfirmCancelCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [overviewData, accountData] = await Promise.all([
        apiFetch<TopUpOverview>("/topups/overview", { token: authToken }),
        apiFetch<{ accounts: ManualFundingAccount[] }>("/topups/manual-accounts", { token: authToken })
      ]);
      setOverview(overviewData);
      setManualAccounts(accountData.accounts);
      apiFetch<{ checkout: TopUpCryptoCheckout | null }>("/topups/crypto/pending", { token: authToken })
        .then((pendingData) => setCryptoCheckout(pendingData.checkout))
        .catch(() => undefined);
    } catch (error) {
      pushToast({
        title: "Top-up data not loaded",
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

  const ledger = useMemo(() => overview?.ledger ?? [], [overview?.ledger]);
  const selectedManualAccount = useMemo(
    () => manualAccounts.find((account) => account.id === selectedManualAccountId),
    [manualAccounts, selectedManualAccountId]
  );
  const selectedApprovalWindow = selectedManualAccount?.processingTime ?? manualAccounts[0]?.processingTime ?? "12-24 hours";
  const selectedInstructionLines = useMemo(() => instructionLines(selectedManualAccount?.instructions), [selectedManualAccount?.instructions]);

  async function attachProof(file?: File) {
    if (!file) return;
    if (file.size > 8_000_000) {
      pushToast({ title: "Proof skipped", message: "Please upload a file smaller than 8MB.", tone: "error" });
      return;
    }
    setProofUrl(await fileToDataUrl(file));
  }

  async function submitTopUp() {
    if (!token) return;
    if (selectedMethod === "CRYPTO") {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        pushToast({ title: "Amount required", message: "Enter the crypto top-up amount first.", tone: "error" });
        return;
      }
      setSubmitting(true);
      try {
        const data = await apiFetch<{ checkout: TopUpCryptoCheckout }>("/topups/crypto-checkout", {
          method: "POST",
          token,
          body: JSON.stringify({ amount: numericAmount })
        });
        setCryptoCheckout(data.checkout);
        setAmount("");
        pushToast({ title: "Crypto checkout created", message: "Send the exact amount shown, then check payment status.", tone: "success" });
      } catch (error) {
        pushToast({ title: "Crypto checkout not created", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!selectedMethod || !selectedManualAccountId || !amount || !transactionId.trim() || !proofUrl) {
      pushToast({ title: "Top-up details required", message: "Select a method and account, then enter amount, transaction ID, and receipt.", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch<{ message: string }>("/topups/request", {
        method: "POST",
        token,
        body: JSON.stringify({
          amount: Number(amount),
          method: selectedMethod,
          manualFundingAccountId: selectedManualAccountId,
          transactionId,
          reference,
          proofUrl
        })
      });
      pushToast({ title: "Top-up submitted", message: data.message, tone: "success" });
      setAmount("");
      setTransactionId("");
      setReference("");
      setProofUrl("");
      setSelectedManualAccountId("");
      setSelectedMethod("");
      await loadData(token);
    } catch (error) {
      pushToast({
        title: "Top-up not submitted",
        message: error instanceof Error ? error.message : "Please check the amount and try again.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function checkCryptoPayment() {
    if (!token || !cryptoCheckout) return;
    setCheckingPayment(true);
    try {
      const data = await apiFetch<{ status: string; mappedStatus: string }>(`/payments/nowpayments/${cryptoCheckout.paymentId}/status`, { token });
      if (data.mappedStatus === "SUCCEEDED") {
        pushToast({ title: "Crypto top-up credited", message: "Your top-up balance has been updated.", tone: "success" });
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
      await apiFetch(`/payments/nowpayments/${cryptoCheckout.paymentId}/cancel`, { method: "POST", token });
      pushToast({ title: "Crypto checkout cancelled", message: "You can start a new top-up checkout anytime.", tone: "info" });
      setConfirmCancelCheckout(false);
      setCryptoCheckout(null);
      await loadData(token);
    } catch (error) {
      pushToast({ title: "Checkout not cancelled", message: error instanceof Error ? error.message : "Please check payment status before trying again.", tone: "error" });
    } finally {
      setCancellingPayment(false);
    }
  }

  function copyCryptoAddress() {
    if (!cryptoCheckout?.payAddress) return;
    navigator.clipboard?.writeText(cryptoCheckout.payAddress).then(() => {
      pushToast({ title: "Address copied", message: "Crypto top-up address copied.", tone: "success" });
    }).catch(() => undefined);
  }

  return (
    <>
      <PageHeader title="Top Up Balance" description="Add non-withdrawable balance for challenge purchases. Manual top-up approval time is shown per funding method." />

      <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Available top-up balance</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{currency(overview?.balance ?? 0)}</div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Pending deposits</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{currency(overview?.pendingAmount ?? 0)}</div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Approved deposits</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{currency(overview?.approvedAmount ?? 0)}</div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Spent on challenges</div>
          <div className="mt-3 truncate text-xl font-black sm:text-3xl">{currency(overview?.spentAmount ?? 0)}</div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
              <Banknote className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Request top-up</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a manual account, pay externally, then submit the transaction ID and receipt.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  disabled={!method.enabled}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55",
                    selectedMethod === method.id
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

          {selectedMethod === "MANUAL" ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Manual funding accounts</h3>
                <Badge tone="warning">Approval {selectedApprovalWindow}</Badge>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {manualAccounts.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04]">No manual accounts are active yet.</div>
                ) : (
                  manualAccounts.map((account) => (
                    <div
                      key={account.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedManualAccountId(account.id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setSelectedManualAccountId(account.id);
                      }}
                      className={cn(
                        "min-w-0 cursor-pointer overflow-hidden rounded-lg border p-4 text-left transition",
                        selectedManualAccountId === account.id
                          ? "border-primary bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/35 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                      )}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-white text-primary dark:bg-slate-950">
                            {account.imageUrl ? (
                              <img src={account.imageUrl} alt={account.label} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </span>
                          <div className="min-w-0">
                          <div className="break-words font-semibold">{account.label}</div>
                          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {[account.asset, account.network, account.accountType].filter(Boolean).join(" / ")}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Processing {account.processingTime ?? "12-24 hours"}
                          </div>
                          </div>
                        </div>
                        <Badge tone={account.accountType === "CRYPTO" ? "primary" : "neutral"}>{account.accountType}</Badge>
                      </div>
                      <div className="mt-3 flex min-w-0 items-center gap-2 rounded-md bg-white p-3 text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        <span className="min-w-0 flex-1 break-all">{account.accountIdentifier}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigator.clipboard.writeText(account.accountIdentifier);
                            pushToast({ title: "Copied", message: "Funding account copied.", tone: "success" });
                          }}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/15"
                          aria-label={`Copy ${account.label} account`}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Minimum {currency(account.minAmount)}</span>
                        {account.holderName ? <span>{account.holderName}</span> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {selectedManualAccount ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-slate-700 dark:text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong>{selectedManualAccount.label}</strong>
                <Badge tone="warning">{selectedManualAccount.processingTime ?? "12-24 hours"}</Badge>
              </div>
              <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0">
                  <div className="rounded-md border border-white/25 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
                    <div className="mb-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Payment address / account</div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 flex-1 break-all font-semibold">{selectedManualAccount.accountIdentifier}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedManualAccount.accountIdentifier);
                          pushToast({ title: "Copied", message: "Funding account copied.", tone: "success" });
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/15"
                        aria-label="Copy payment address"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {selectedInstructionLines.length ? (
                    <ul className="mt-3 grid gap-2 leading-6">
                      {selectedInstructionLines.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 leading-6">Send payment to this account, then submit the transaction ID and receipt.</p>
                  )}
                </div>
                {selectedManualAccount.accountType === "CRYPTO" ? (
                  <QrCodeCard
                    title={`${selectedManualAccount.asset ?? "Crypto"} ${selectedManualAccount.network ?? ""}`.trim()}
                    value={selectedManualAccount.accountIdentifier}
                    fileName={`${selectedManualAccount.label.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
                    shareText="PipNest Markets top-up address"
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Amount
              <Input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} placeholder="100" inputMode="decimal" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Transaction ID
              <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="TXID / UTR / reference number" />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Optional note
            <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Short note for admin" />
          </label>

          <label className="mt-4 grid cursor-pointer gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold transition hover:border-primary/50 hover:bg-blue-50 dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-primary/10">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-white text-primary dark:bg-slate-950">
                {proofUrl ? <Paperclip className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
              </span>
              <span>
                <span className="block">{proofUrl ? "Receipt attached" : "Attach payment receipt"}</span>
                <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Receipt is required. PNG, JPG, PDF, or text proof up to 8MB.</span>
              </span>
            </span>
            <input type="file" accept="image/*,.pdf,.txt" className="sr-only" onChange={(event) => attachProof(event.target.files?.[0])} />
          </label>

          <Button
            className="mt-5 w-full"
            onClick={submitTopUp}
            disabled={
              submitting ||
              !selectedMethod ||
              (selectedMethod === "CRYPTO" ? !amount : !selectedManualAccountId || !amount || !transactionId.trim() || !proofUrl || selectedMethod !== "MANUAL")
            }
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedMethod === "CRYPTO" ? <Wallet className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {selectedMethod === "CRYPTO" ? "Open Crypto Checkout" : "Submit Manual Top-up"}
          </Button>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="font-semibold">Balance rules</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>Top-up balance is only for challenge purchases.</p>
            <p>It is not withdrawable and does not count as payout balance.</p>
            <p>Manual deposits stay pending until admin approval within {selectedApprovalWindow}.</p>
            <p>Transaction ID and receipt are required for every manual request.</p>
            <p>Challenge purchase with top-up balance requires enough approved balance after coupon discount.</p>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <h2 className="font-semibold">Top-up ledger</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Deposits and challenge purchases paid from top-up balance.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Receipt</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Loading ledger...</td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No top-up activity yet.</td></tr>
              ) : (
                ledger.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                    <td className="px-5 py-4 font-semibold">{item.type}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.reference}</td>
                    <td className="px-5 py-4">{item.method}</td>
                    <td className="px-5 py-4">
                      {item.receiptUrl ? (
                        <a href={item.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Open</a>
                      ) : item.type === "Top-up Deposit" ? (
                        "Required"
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={cn("px-5 py-4 font-semibold", item.direction === "CREDIT" ? "text-profit" : "text-loss")}>{item.direction === "CREDIT" ? "+" : "-"}{currency(item.amount)}</td>
                    <td className="px-5 py-4"><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(item.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {cryptoCheckout ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4 md:items-center">
          <div className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#07152d] sm:rounded-lg">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10 sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase text-primary">NOWPayments top-up</p>
                <h2 className="mt-1 text-xl font-semibold">Crypto top-up checkout</h2>
              </div>
              <Badge tone={statusTone(cryptoCheckout.status)}>{cryptoCheckout.status}</Badge>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Top-up amount</span>
                  <strong>{currency(Number(cryptoCheckout.priceAmount ?? cryptoCheckout.topUp?.amount ?? 0))}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Pay exact amount</span>
                  <strong>{cryptoCheckout.payAmount ?? "-"} {cryptoCheckout.payCurrency?.toUpperCase() ?? ""}</strong>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                  <span className="text-sm font-semibold">Payment address</span>
                  <button
                    type="button"
                    onClick={copyCryptoAddress}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="min-w-0 break-all font-mono text-xs">{cryptoCheckout.payAddress ?? "Address unavailable"}</span>
                    <Copy className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                  <div className="rounded-md border border-amber-300/40 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                    Only cancel if you have not sent payment. If you already paid, use Check payment and wait for provider confirmation.
                  </div>
                </div>
                {cryptoCheckout.payAddress ? (
                  <QrCodeCard
                    title={`${cryptoCheckout.payCurrency?.toUpperCase() ?? "Crypto"} address`}
                    value={cryptoCheckout.payAddress}
                    fileName={`pipnest-topup-${cryptoCheckout.paymentId}-crypto-qr.png`}
                    shareText="PipNest Markets crypto top-up address"
                  />
                ) : null}
              </div>

              <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#07152d] sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:p-5">
                <Button type="button" variant="danger" onClick={() => setConfirmCancelCheckout(true)}>Cancel checkout</Button>
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
                <h3 className="text-lg font-semibold">Cancel crypto top-up?</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">If payment was already sent, do not cancel. Use Check payment and wait for confirmation.</p>
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setConfirmCancelCheckout(false)} disabled={cancellingPayment}>Keep checkout</Button>
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
    </>
  );
}
