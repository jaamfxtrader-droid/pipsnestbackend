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

const methods = [
  { id: "MANUAL", label: "Manual", status: "Active", icon: ShieldCheck, enabled: true },
  { id: "BANK", label: "Bank", status: "Coming soon", icon: Landmark, enabled: false },
  { id: "CRYPTO", label: "Crypto", status: "Coming soon", icon: Wallet, enabled: false },
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <>
      <PageHeader title="Top Up Balance" description="Add non-withdrawable balance for challenge purchases. Manual top-up approval time is shown per funding method." />

      <section className="grid gap-5 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Available top-up balance</div>
          <div className="mt-3 text-3xl font-black">{currency(overview?.balance ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Pending deposits</div>
          <div className="mt-3 text-3xl font-black">{currency(overview?.pendingAmount ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Approved deposits</div>
          <div className="mt-3 text-3xl font-black">{currency(overview?.approvedAmount ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Spent on challenges</div>
          <div className="mt-3 text-3xl font-black">{currency(overview?.spentAmount ?? 0)}</div>
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

          <Button className="mt-5 w-full" onClick={submitTopUp} disabled={submitting || !selectedMethod || !selectedManualAccountId || !amount || !transactionId.trim() || !proofUrl || selectedMethod !== "MANUAL"}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Submit Manual Top-up
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
    </>
  );
}
