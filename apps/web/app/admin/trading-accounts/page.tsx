"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock, KeyRound, Loader2, Monitor, RefreshCw, Save, Server, ShieldOff, Trophy, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type AccountStatus = "PENDING" | "ACTIVE" | "PASSED" | "FAILED" | "SUSPENDED";
type ChallengeStage = "PHASE_1" | "PHASE_2" | "FUNDED";

type TradingAccount = {
  id: string;
  platform: "MT4" | "MT5";
  stage: ChallengeStage;
  login: string;
  password?: string | null;
  investorPassword?: string | null;
  server: string;
  serverLink?: string | null;
  balance: string | number;
  equity: string | number;
  accountStatus: AccountStatus;
  statusReason?: string | null;
  completedAt?: string | null;
  disabledAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  user: AuthUser;
  challenge: {
    id: string;
    name: string;
    accountSize: string | number;
    profitTargetPercent: number;
    dailyDrawdownPercent: number;
    maxDrawdownPercent: number;
  };
  order?: {
    orderNumber: string;
  } | null;
  stats?: Array<{
    balance: string | number;
    equity: string | number;
    profit: string | number;
    dailyDrawdown: string | number;
    maxDrawdown: string | number;
    profitTargetProgress: number;
    openTrades: number;
    closedTrades: number;
  }>;
};

type CredentialForm = {
  login: string;
  server: string;
  password: string;
  investorPassword: string;
  serverLink: string;
};

type StatsForm = {
  balance: string;
  equity: string;
  dailyDrawdown: string;
  maxDrawdown: string;
  openTrades: string;
  closedTrades: string;
  status: AccountStatus;
  note: string;
};

type StatsFieldKey = keyof StatsForm;

function statusTone(status: AccountStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "ACTIVE" || status === "PASSED") return "profit";
  if (status === "FAILED" || status === "SUSPENDED") return "loss";
  return "warning";
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function stageLabel(stage: ChallengeStage) {
  if (stage === "PHASE_1") return "Phase 1";
  if (stage === "PHASE_2") return "Phase 2";
  return "Real Account";
}

function cleanPendingLogin(value: string) {
  return value.startsWith("PN-") ? "" : value;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

export default function TradingAccountManagementPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CredentialForm>({
    login: "",
    server: "",
    password: "",
    investorPassword: "",
    serverLink: ""
  });
  const [statsForm, setStatsForm] = useState<StatsForm>({
    balance: "0",
    equity: "0",
    dailyDrawdown: "0",
    maxDrawdown: "0",
    openTrades: "0",
    closedTrades: "0",
    status: "ACTIVE",
    note: ""
  });
  const [statsBaseline, setStatsBaseline] = useState<StatsForm | null>(null);
  const [savingStatField, setSavingStatField] = useState<StatsFieldKey | null>(null);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ accounts: TradingAccount[] }>("/admin/trading-accounts", { token: authToken });
      setAccounts(data.accounts);
      setSelectedId((current) => current || data.accounts[0]?.id || "");
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
    if (scope !== "admin" || !token) return;
    loadData(token);
  }, [scope, token]);

  const selected = useMemo(() => accounts.find((account) => account.id === selectedId) ?? accounts[0], [accounts, selectedId]);
  const pendingCount = useMemo(() => accounts.filter((account) => account.accountStatus === "PENDING").length, [accounts]);
  const activePackages = useMemo(() => accounts.filter((account) => account.accountStatus === "ACTIVE").length, [accounts]);
  const breachedPackages = useMemo(() => accounts.filter((account) => account.accountStatus === "FAILED" || account.accountStatus === "SUSPENDED").length, [accounts]);
  const statsLocked = selected?.accountStatus === "PENDING";

  function syncSelectedForms(account: TradingAccount) {
    setForm({
      login: cleanPendingLogin(account.login),
      server: account.server === "Pending assignment" ? "" : account.server,
      password: account.password ?? "",
      investorPassword: account.investorPassword ?? "",
      serverLink: account.serverLink ?? ""
    });
    const latestStats = account.stats?.[0];
    const nextStatsForm = {
      balance: String(latestStats?.balance ?? account.balance ?? account.challenge.accountSize),
      equity: String(latestStats?.equity ?? account.equity ?? account.challenge.accountSize),
      dailyDrawdown: String(latestStats?.dailyDrawdown ?? 0),
      maxDrawdown: String(latestStats?.maxDrawdown ?? 0),
      openTrades: String(latestStats?.openTrades ?? 0),
      closedTrades: String(latestStats?.closedTrades ?? 0),
      status: account.accountStatus,
      note: account.statusReason ?? ""
    };
    setStatsForm(nextStatsForm);
    setStatsBaseline(nextStatsForm);
  }

  useEffect(() => {
    if (!selected) return;
    syncSelectedForms(selected);
  }, [selected?.id]);

  function updateField<Key extends keyof CredentialForm>(key: Key, value: CredentialForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateStatsField<Key extends keyof StatsForm>(key: Key, value: StatsForm[Key]) {
    setStatsForm((current) => ({ ...current, [key]: value }));
  }

  function isStatsFieldDirty(key: StatsFieldKey) {
    return Boolean(statsBaseline && statsForm[key] !== statsBaseline[key]);
  }

  function numericStatPayload(key: Exclude<StatsFieldKey, "status" | "note">) {
    const value = optionalNumber(statsForm[key]);
    if (value === undefined) {
      pushToast({ title: "Value required", message: "Enter a value before saving this field.", tone: "error" });
      return null;
    }
    return { [key]: value, note: statsForm.note };
  }

  function updateAccountInList(account: TradingAccount) {
    setAccounts((current) => current.map((item) => (item.id === account.id ? account : item)));
    syncSelectedForms(account);
  }

  async function saveCredentials() {
    if (!token || !selected) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ account: TradingAccount; message: string }>(`/admin/trading-accounts/${selected.id}/credentials`, {
        method: "PUT",
        token,
        body: JSON.stringify(form)
      });
      updateAccountInList(data.account);
      pushToast({ title: selected.accountStatus === "PENDING" ? "Account approved" : "Server updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Credentials not saved",
        message: error instanceof Error ? error.message : "Please check the form.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveManualStats(statusOverride?: AccountStatus) {
    if (!token || !selected) return;
    setSaving(true);
    try {
      const payload = {
        balance: optionalNumber(statsForm.balance),
        equity: optionalNumber(statsForm.equity),
        dailyDrawdown: optionalNumber(statsForm.dailyDrawdown),
        maxDrawdown: optionalNumber(statsForm.maxDrawdown),
        openTrades: optionalNumber(statsForm.openTrades),
        closedTrades: optionalNumber(statsForm.closedTrades),
        status: statusOverride ?? statsForm.status,
        note: statsForm.note
      };
      const data = await apiFetch<{ account: TradingAccount; message: string }>(`/admin/trading-accounts/${selected.id}/manual-stats`, {
        method: "PUT",
        token,
        body: JSON.stringify(payload)
      });
      updateAccountInList(data.account);
      pushToast({ title: "Manual stats updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Stats not updated",
        message: error instanceof Error ? error.message : "Please check the manual tracking fields.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveStatsField(key: StatsFieldKey) {
    if (!token || !selected || statsLocked) return;
    let payload: Partial<Record<StatsFieldKey, string | number>> | null;
    if (key === "status") {
      payload = { status: statsForm.status, note: statsForm.note };
    } else if (key === "note") {
      payload = { note: statsForm.note };
    } else {
      payload = numericStatPayload(key);
    }
    if (!payload) return;

    setSavingStatField(key);
    try {
      const data = await apiFetch<{ account: TradingAccount; message: string }>(`/admin/trading-accounts/${selected.id}/manual-stats`, {
        method: "PUT",
        token,
        body: JSON.stringify(payload)
      });
      updateAccountInList(data.account);
      pushToast({ title: "Field saved", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Field not saved",
        message: error instanceof Error ? error.message : "Please check the value and try again.",
        tone: "error"
      });
    } finally {
      setSavingStatField(null);
    }
  }

  function FieldSaveButton({ field }: { field: StatsFieldKey }) {
    if (!isStatsFieldDirty(field) || statsLocked) return null;
    return (
      <button
        type="button"
        onClick={() => saveStatsField(field)}
        disabled={saving || savingStatField === field}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Save ${field}`}
      >
        {savingStatField === field ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <>
      <PageHeader
        title="Challenge Account Control"
        description="Assign MT4/MT5 servers, manually track drawdown/equity, and move traders through phases to real accounts."
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
          <div className="mt-2 text-2xl font-semibold">{accounts.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Pending approval</div>
          <div className="mt-2 text-2xl font-semibold">{pendingCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Active packages</div>
          <div className="mt-2 text-2xl font-semibold">{activePackages}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Breached / suspended</div>
          <div className="mt-2 text-2xl font-semibold">{breachedPackages}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:col-span-4 xl:col-span-1">
          <div className="text-sm text-slate-500 dark:text-slate-400">Approval SLA</div>
          <div className="mt-2 text-2xl font-semibold">4-5h</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 px-2 pt-2">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Applications</h2>
          </div>
          <div className="grid max-h-[720px] gap-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No trading account applications yet.</div>
            ) : (
              accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedId(account.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition",
                    selected?.id === account.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{account.user.name}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {account.platform} / {stageLabel(account.stage)} / {account.challenge.name}
                      </div>
                    </div>
                    <Badge tone={statusTone(account.accountStatus)}>{account.accountStatus}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(account.createdAt)}</div>
                  {account.stats?.[0] ? (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-950">Equity {formatCurrency(account.stats[0].equity)}</span>
                      <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-950">Daily {account.stats[0].dailyDrawdown}%</span>
                      <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-950">Max {account.stats[0].maxDrawdown}%</span>
                    </div>
                  ) : null}
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
                    <h2 className="text-xl font-semibold">{selected.platform} / {stageLabel(selected.stage)} / {selected.challenge.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.user.name} / {selected.user.email}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.order?.orderNumber ?? "Manual account"} / {formatCurrency(selected.challenge.accountSize)}</p>
                    {selected.statusReason ? <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-300">{selected.statusReason}</p> : null}
                  </div>
                  <Badge tone={statusTone(selected.accountStatus)}>{selected.accountStatus}</Badge>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <UserRound className="h-5 w-5 text-primary" />
                    <div className="mt-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Trader phone</div>
                    <p className="mt-1 text-sm font-semibold">{selected.user.phone ?? "Not provided"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <Clock className="h-5 w-5 text-primary" />
                    <div className="mt-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Requested</div>
                    <p className="mt-1 text-sm font-semibold">{formatDate(selected.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div className="mt-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Target approval</div>
                    <p className="mt-1 text-sm font-semibold">4-5 hours</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-4 flex items-center gap-2 font-semibold">
                    <Server className="h-5 w-5 text-primary" />
                    Assign server credentials
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold">
                      Login / server number
                      <Input value={form.login} onChange={(event) => updateField("login", event.target.value)} placeholder="90050123" />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Server
                      <Input value={form.server} onChange={(event) => updateField("server", event.target.value)} placeholder="Pipnest-MT5-Demo" />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Password
                      <Input value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Master password" />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Investor password
                      <Input value={form.investorPassword} onChange={(event) => updateField("investorPassword", event.target.value)} placeholder="Optional investor password" />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                      Server link
                      <Input value={form.serverLink} onChange={(event) => updateField("serverLink", event.target.value)} placeholder="https://..." />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Manual account tracking
                    </div>
                    {statsLocked ? <Badge tone="warning">Approve server first</Badge> : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2 text-sm font-semibold">
                      Balance
                      <div className="flex gap-2">
                        <Input disabled={statsLocked} value={statsForm.balance} onChange={(event) => updateStatsField("balance", event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
                        <FieldSaveButton field="balance" />
                      </div>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Equity
                      <div className="flex gap-2">
                        <Input disabled={statsLocked} value={statsForm.equity} onChange={(event) => updateStatsField("equity", event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
                        <FieldSaveButton field="equity" />
                      </div>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Status
                      <div className="flex gap-2">
                        <Select
                          className="min-w-0 flex-1"
                          value={statsForm.status}
                          onChange={(event) => updateStatsField("status", event.target.value as AccountStatus)}
                          disabled={statsLocked}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="ACTIVE">Active</option>
                          <option value="PASSED">Passed</option>
                          <option value="FAILED">Failed</option>
                          <option value="SUSPENDED">Suspended</option>
                        </Select>
                        <FieldSaveButton field="status" />
                      </div>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Daily drawdown %
                      <div className="flex gap-2">
                        <Input disabled={statsLocked} value={statsForm.dailyDrawdown} onChange={(event) => updateStatsField("dailyDrawdown", event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
                        <FieldSaveButton field="dailyDrawdown" />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Limit {selected.challenge.dailyDrawdownPercent}%</span>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Max drawdown %
                      <div className="flex gap-2">
                        <Input disabled={statsLocked} value={statsForm.maxDrawdown} onChange={(event) => updateStatsField("maxDrawdown", event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
                        <FieldSaveButton field="maxDrawdown" />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Limit {selected.challenge.maxDrawdownPercent}%</span>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Profit target
                      <Input value={`${selected.challenge.profitTargetPercent}%`} readOnly />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Progress auto-calculated from equity.</span>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Open trades
                      <div className="flex gap-2">
                        <Input disabled={statsLocked} value={statsForm.openTrades} onChange={(event) => updateStatsField("openTrades", event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
                        <FieldSaveButton field="openTrades" />
                      </div>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Closed trades
                      <div className="flex gap-2">
                        <Input disabled={statsLocked} value={statsForm.closedTrades} onChange={(event) => updateStatsField("closedTrades", event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
                        <FieldSaveButton field="closedTrades" />
                      </div>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold md:col-span-3">
                      Admin note / reason
                      <div className="flex items-start gap-2">
                        <textarea
                          value={statsForm.note}
                          onChange={(event) => updateStatsField("note", event.target.value)}
                          rows={3}
                          disabled={statsLocked}
                          className="min-h-[6rem] flex-1 rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-white"
                          placeholder="Reason for pass, breach, suspension, or manual update"
                        />
                        <FieldSaveButton field="note" />
                      </div>
                    </label>
                  </div>
                  {statsLocked ? (
                    <div className="mt-4 rounded-md border border-warning/20 bg-warning/10 p-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                      Approve this {selected.platform} {stageLabel(selected.stage)} server before recording manual performance data.
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                    <div className="rounded-md bg-white p-3 dark:bg-slate-950">
                      <span className="text-slate-500 dark:text-slate-400">Latest progress</span>
                      <strong className="mt-1 block">{Math.round(selected.stats?.[0]?.profitTargetProgress ?? 0)}%</strong>
                    </div>
                    <div className="rounded-md bg-white p-3 dark:bg-slate-950">
                      <span className="text-slate-500 dark:text-slate-400">Package state</span>
                      <strong className="mt-1 block">{selected.expiredAt ? "Expired" : selected.disabledAt ? "Server disabled" : "Open"}</strong>
                    </div>
                    <div className="rounded-md bg-white p-3 dark:bg-slate-950">
                      <span className="text-slate-500 dark:text-slate-400">Next action</span>
                      <strong className="mt-1 block">{selected.accountStatus === "PASSED" ? "Trader can apply next stage" : "Manual tracking"}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button type="button" onClick={saveCredentials} disabled={saving || !form.login.trim() || !form.server.trim() || !form.password.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    {selected.accountStatus === "PENDING" ? "Approve" : "Update Server"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => saveManualStats()} disabled={saving || statsLocked}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Stats
                  </Button>
                  <Button type="button" onClick={() => saveManualStats("PASSED")} disabled={saving || statsLocked}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                    Mark Passed
                  </Button>
                  <Button type="button" variant="danger" onClick={() => saveManualStats("FAILED")} disabled={saving || statsLocked}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Fail & Expire
                  </Button>
                  <Button type="button" variant="danger" onClick={() => saveManualStats("SUSPENDED")} disabled={saving || statsLocked}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                    Suspend
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[26rem] place-items-center p-8 text-center text-slate-500 dark:text-slate-400">
              Select a trading account application.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
