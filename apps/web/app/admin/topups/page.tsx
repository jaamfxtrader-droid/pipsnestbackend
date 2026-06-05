"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Plus, RefreshCw, Save, Trash2, UploadCloud, Wallet, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn, currency } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type TopUpStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  minAmount: string | number;
  isActive: boolean;
  sortOrder: number;
};

type TopUp = {
  id: string;
  amount: string | number;
  method: "MANUAL" | "BANK" | "CRYPTO" | "CARD";
  status: TopUpStatus;
  reference?: string | null;
  transactionId?: string | null;
  proofUrl?: string | null;
  adminNote?: string | null;
  createdAt: string;
  manualFundingAccount?: ManualFundingAccount | null;
  user: Pick<AuthUser, "id" | "name" | "email" | "username" | "phone" | "avatarUrl">;
};

const emptyAccountForm = {
  label: "",
  accountType: "CRYPTO" as ManualFundingAccount["accountType"],
  asset: "",
  network: "",
  accountIdentifier: "",
  holderName: "",
  instructions: "",
  imageUrl: "",
  processingTime: "12-24 hours",
  minAmount: "10",
  isActive: true,
  sortOrder: "100"
};

function statusTone(status: TopUpStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "APPROVED") return "profit";
  if (status === "REJECTED") return "loss";
  return "warning";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function instructionLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AdminTopUpsPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [manualAccounts, setManualAccounts] = useState<ManualFundingAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editingAccountId, setEditingAccountId] = useState("");
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<ManualFundingAccount | null>(null);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [topUpData, accountData] = await Promise.all([
        apiFetch<{ topUps: TopUp[] }>("/admin/topups", { token: authToken }),
        apiFetch<{ accounts: ManualFundingAccount[] }>("/admin/topups/manual-accounts", { token: authToken })
      ]);
      setTopUps(topUpData.topUps);
      setManualAccounts(accountData.accounts);
      setSelectedId((current) => current || topUpData.topUps[0]?.id || "");
    } catch (error) {
      pushToast({
        title: "Top-ups not loaded",
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

  const selected = useMemo(() => topUps.find((topUp) => topUp.id === selectedId) ?? topUps[0], [selectedId, topUps]);
  const pendingCount = useMemo(() => topUps.filter((topUp) => topUp.status === "PENDING").length, [topUps]);
  const activeManualAccounts = useMemo(() => manualAccounts.filter((account) => account.isActive).length, [manualAccounts]);
  const accountInstructionCount = useMemo(() => instructionLines(accountForm.instructions).length, [accountForm.instructions]);
  const accountInstructionsValid = accountInstructionCount >= 3 && accountInstructionCount <= 5;

  useEffect(() => {
    setAdminNote(selected?.adminNote ?? "");
  }, [selected?.id, selected?.adminNote]);

  async function updateStatus(status: TopUpStatus) {
    if (!token || !selected) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ topUp: TopUp; message: string }>(`/admin/topups/${selected.id}/status`, {
        method: "PUT",
        token,
        body: JSON.stringify({ status, adminNote })
      });
      setTopUps((current) => current.map((topUp) => (topUp.id === selected.id ? { ...topUp, ...data.topUp } : topUp)));
      pushToast({ title: "Top-up updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Top-up not updated",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  function editAccount(account: ManualFundingAccount) {
    setEditingAccountId(account.id);
    setAccountForm({
      label: account.label,
      accountType: account.accountType,
      asset: account.asset ?? "",
      network: account.network ?? "",
      accountIdentifier: account.accountIdentifier,
      holderName: account.holderName ?? "",
      instructions: account.instructions ?? "",
      imageUrl: account.imageUrl ?? "",
      processingTime: account.processingTime ?? "12-24 hours",
      minAmount: String(account.minAmount),
      isActive: account.isActive,
      sortOrder: String(account.sortOrder)
    });
  }

  function resetAccountForm() {
    setEditingAccountId("");
    setAccountForm(emptyAccountForm);
  }

  async function saveManualAccount() {
    if (!token) return;
    setSavingAccount(true);
    try {
      const payload = {
        ...accountForm,
        minAmount: Number(accountForm.minAmount),
        sortOrder: Number(accountForm.sortOrder)
      };
      const data = await apiFetch<{ account: ManualFundingAccount }>(editingAccountId ? `/admin/topups/manual-accounts/${editingAccountId}` : "/admin/topups/manual-accounts", {
        method: editingAccountId ? "PUT" : "POST",
        token,
        body: JSON.stringify(payload)
      });
      setManualAccounts((current) => {
        if (editingAccountId) return current.map((account) => (account.id === editingAccountId ? data.account : account));
        return [...current, data.account].sort((left, right) => left.sortOrder - right.sortOrder);
      });
      resetAccountForm();
      pushToast({ title: editingAccountId ? "Account updated" : "Account created", message: `${data.account.label} is available for manual top-ups.`, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Funding account not saved",
        message: error instanceof Error ? error.message : "Please check the account fields.",
        tone: "error"
      });
    } finally {
      setSavingAccount(false);
    }
  }

  async function deleteManualAccount(account: ManualFundingAccount) {
    if (!token) return;

    setSavingAccount(true);
    try {
      const data = await apiFetch<{ message: string }>(`/admin/topups/manual-accounts/${account.id}`, {
        method: "DELETE",
        token
      });
      setManualAccounts((current) => current.filter((item) => item.id !== account.id));
      if (editingAccountId === account.id) resetAccountForm();
      setDeleteAccountTarget(null);
      pushToast({ title: "Account deleted", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Account not deleted",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSavingAccount(false);
    }
  }

  async function attachAccountImage(file?: File) {
    if (!file) return;
    if (file.size > 750_000) {
      pushToast({ title: "Image skipped", message: "Please upload an image smaller than 750KB.", tone: "error" });
      return;
    }
    setAccountForm((current) => ({ ...current, imageUrl: "" }));
    const imageUrl = await fileToDataUrl(file);
    setAccountForm((current) => ({ ...current, imageUrl }));
  }

  return (
    <>
      <PageHeader
        title="Top-up Management"
        description="Review manual top-up requests and credit trader balances after verification."
        action={
          <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total requests</div>
          <div className="mt-2 text-2xl font-semibold">{topUps.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Pending</div>
          <div className="mt-2 text-2xl font-semibold">{pendingCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Selected amount</div>
          <div className="mt-2 text-2xl font-semibold">{currency(selected?.amount ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Active accounts</div>
          <div className="mt-2 text-2xl font-semibold">{activeManualAccounts}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 px-2 pt-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Requests</h2>
          </div>
          <div className="grid max-h-[720px] gap-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading top-ups...
              </div>
            ) : topUps.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No top-up requests yet.</div>
            ) : (
              topUps.map((topUp) => (
                <button
                  key={topUp.id}
                  type="button"
                  onClick={() => setSelectedId(topUp.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition",
                    selected?.id === topUp.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{topUp.user.name}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{currency(topUp.amount)} / {topUp.method}</div>
                    </div>
                    <Badge tone={statusTone(topUp.status)}>{topUp.status}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(topUp.createdAt)}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {selected ? (
            <>
              <div className="border-b border-slate-200 p-5 dark:border-white/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.user.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.user.email} / {selected.user.phone ?? "No phone"}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(selected.createdAt)}</p>
                  </div>
                  <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Amount</div>
                    <p className="mt-2 text-lg font-semibold">{currency(selected.amount)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Method</div>
                    <p className="mt-2 text-lg font-semibold">{selected.method}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Funding account</div>
                    <p className="mt-2 text-sm font-semibold">{selected.manualFundingAccount?.label ?? "No account"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Transaction ID</div>
                    <p className="mt-2 break-all text-sm font-semibold">{selected.transactionId || "No transaction ID"}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Reference</div>
                    <p className="mt-2 text-sm font-semibold">{selected.reference || "No reference"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Admin account details</div>
                    <p className="mt-2 break-all text-sm font-semibold">{selected.manualFundingAccount?.accountIdentifier ?? "No account details"}</p>
                  </div>
                </div>

                {selected.proofUrl ? (
                  <a href={selected.proofUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm font-semibold text-primary transition hover:bg-primary/15">
                    Open receipt
                  </a>
                ) : null}

                <label className="grid gap-2 text-sm font-semibold">
                  Admin note
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={4}
                    className="min-h-[7rem] rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                    placeholder="Approval note or rejection reason"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => updateStatus("PENDING")} disabled={saving || selected.status === "PENDING"}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Move to Pending
                  </Button>
                  <Button type="button" variant="danger" onClick={() => updateStatus("REJECTED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                  <Button type="button" onClick={() => updateStatus("APPROVED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve & Credit
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[26rem] place-items-center p-8 text-center text-slate-500 dark:text-slate-400">
              Select a top-up request.
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Manual Funding Accounts</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These accounts are shown to traders for manual top-up payments.</p>
            </div>
            <Button type="button" variant="secondary" onClick={resetAccountForm}>
              <Plus className="h-4 w-4" />
              New Account
            </Button>
          </div>
        </div>

        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-3">
            {manualAccounts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04]">No manual accounts yet.</div>
            ) : (
              manualAccounts.map((account) => (
                <div
                  key={account.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => editAccount(account)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    editAccount(account);
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 text-left transition",
                    editingAccountId === account.id
                      ? "border-primary/45 bg-primary/10"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-200 dark:bg-slate-950">
                        {account.imageUrl ? (
                          <img src={account.imageUrl} alt={account.label} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                      <div className="break-words font-semibold">{account.label}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {[account.asset, account.network, account.accountType].filter(Boolean).join(" / ")}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Processing {account.processingTime ?? "12-24 hours"}
                      </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={account.isActive ? "profit" : "neutral"}>{account.isActive ? "Active" : "Inactive"}</Badge>
                      <Badge tone={account.accountType === "CRYPTO" ? "primary" : "neutral"}>{account.accountType}</Badge>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteAccountTarget(account);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          event.stopPropagation();
                          setDeleteAccountTarget(account);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                        aria-label={`Delete ${account.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 break-all rounded-md bg-white p-3 text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200">{account.accountIdentifier}</div>
                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Minimum {currency(account.minAmount)}</span>
                    <span>Sort {account.sortOrder}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <h3 className="font-semibold">{editingAccountId ? "Edit account" : "Create account"}</h3>
            <div className="mt-4 grid gap-4">
              <label className="grid cursor-pointer gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold transition hover:border-primary/50 dark:border-white/15 dark:bg-slate-950">
                <span className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-md bg-slate-100 text-primary dark:bg-white/10">
                    {accountForm.imageUrl ? (
                      <img src={accountForm.imageUrl} alt="Manual funding method" className="h-full w-full object-cover" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                  </span>
                  <span>
                    <span className="block">{accountForm.imageUrl ? "Method image attached" : "Upload method image"}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Shown to traders when selecting a top-up method.</span>
                  </span>
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => attachAccountImage(event.target.files?.[0])} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Label
                <Input value={accountForm.label} onChange={(event) => setAccountForm((current) => ({ ...current, label: event.target.value }))} placeholder="USDT TRC20 Wallet" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Type
                  <Select
                    value={accountForm.accountType}
                    onChange={(event) => setAccountForm((current) => ({ ...current, accountType: event.target.value as ManualFundingAccount["accountType"] }))}
                  >
                    <option value="CRYPTO">Crypto</option>
                    <option value="BANK">Bank</option>
                    <option value="WALLET">Wallet</option>
                  </Select>
                </label>
                <SwitchField
                  checked={accountForm.isActive}
                  onChange={(checked) => setAccountForm((current) => ({ ...current, isActive: checked }))}
                  label="Active"
                  description={accountForm.isActive ? "Visible to traders" : "Hidden from traders"}
                  className="h-full"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Asset
                  <Input value={accountForm.asset} onChange={(event) => setAccountForm((current) => ({ ...current, asset: event.target.value }))} placeholder="USDT / BNB / USD" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Network
                  <Input value={accountForm.network} onChange={(event) => setAccountForm((current) => ({ ...current, network: event.target.value }))} placeholder="TRC20 / BEP20 / Airtm" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Account identifier
                <Input value={accountForm.accountIdentifier} onChange={(event) => setAccountForm((current) => ({ ...current, accountIdentifier: event.target.value }))} placeholder="Wallet address or account email" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Holder name
                <Input value={accountForm.holderName} onChange={(event) => setAccountForm((current) => ({ ...current, holderName: event.target.value }))} placeholder="PipNest Markets" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Processing time
                <Input value={accountForm.processingTime} onChange={(event) => setAccountForm((current) => ({ ...current, processingTime: event.target.value }))} placeholder="12-24 hours" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Minimum amount
                  <Input value={accountForm.minAmount} onChange={(event) => setAccountForm((current) => ({ ...current, minAmount: event.target.value.replace(/[^\d.]/g, "") }))} inputMode="decimal" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Sort order
                  <Input value={accountForm.sortOrder} onChange={(event) => setAccountForm((current) => ({ ...current, sortOrder: event.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Instruction bullets
                <textarea
                  value={accountForm.instructions}
                  onChange={(event) => setAccountForm((current) => ({ ...current, instructions: event.target.value }))}
                  rows={4}
                  className="min-h-[7rem] rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                  placeholder={"Send only USDT on TRC20\nCopy the exact wallet address before sending\nSubmit transaction ID and receipt after payment"}
                />
                <span className={cn("text-xs", accountInstructionsValid ? "text-slate-500 dark:text-slate-400" : "text-amber-600 dark:text-amber-300")}>
                  Add 3 to 5 bullets, one per line. Current: {accountInstructionCount}
                </span>
              </label>
              <Button type="button" onClick={saveManualAccount} disabled={savingAccount || !accountForm.label || !accountForm.accountIdentifier || !accountInstructionsValid || !accountForm.processingTime.trim()}>
                {savingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingAccountId ? "Update Account" : "Create Account"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteAccountTarget)}
        title="Delete manual funding account?"
        description={
          deleteAccountTarget
            ? `${deleteAccountTarget.label} will be removed from trader top-up options. Existing top-up requests keep their receipt and transaction history.`
            : ""
        }
        confirmLabel="Delete Account"
        loading={savingAccount}
        onClose={() => setDeleteAccountTarget(null)}
        onConfirm={() => {
          if (deleteAccountTarget) void deleteManualAccount(deleteAccountTarget);
        }}
      />
    </>
  );
}
