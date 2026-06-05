"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeDollarSign, BarChart3, CheckCircle2, Download, Headphones, IdCard, Loader2, RefreshCw, ShieldCheck, TrendingUp, Users, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type StatusRow = {
  status: string;
  count: number;
  amount?: number;
};

type DashboardSeries = {
  date: string;
  label: string;
  revenue: number;
  topUps: number;
  payouts: number;
  orders: number;
};

type ChallengePerformance = {
  id: string;
  name: string;
  phaseCount: number;
  isActive: boolean;
  price: number;
  accountSize: number;
  orders: number;
  accounts: number;
  revenue: number;
};

type RecentActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  amount?: number | null;
  createdAt: string;
};

type AdminAnalytics = {
  metrics: {
    totalTraders: number;
    activeTraders: number;
    blockedTraders: number;
    pendingTraders: number;
    adminUsers: number;
    activeChallenges: number;
    totalChallenges: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    grossRevenue: number;
    revenueThisMonth: number;
    approvedTopUpAmount: number;
    approvedTopUpCount: number;
    pendingTopUps: number;
    topUpsThisMonth: number;
    pendingPayouts: number;
    pendingPayoutAmount: number;
    paidPayoutAmount: number;
    paidPayoutCount: number;
    paidPayoutsThisMonth: number;
    openTickets: number;
    urgentTickets: number;
    pendingKyc: number;
    approvedKyc: number;
    activeAccounts: number;
    pendingAccounts: number;
    passedAccounts: number;
    failedAccounts: number;
    passRate: number;
    avgDailyDrawdown: number;
    avgMaxDrawdown: number;
    avgTargetProgress: number;
  };
  series: DashboardSeries[];
  accountStatuses: StatusRow[];
  orderStatuses: StatusRow[];
  payoutStatuses: StatusRow[];
  topUpStatuses: StatusRow[];
  kycStatuses: StatusRow[];
  challengePerformance: ChallengePerformance[];
  recentActivity: RecentActivity[];
};

type ReportRange = "daily" | "weekly" | "annual" | "yearly";
type ReportRow = {
  section: string;
  name: string;
  value: string | number;
  amount?: string | number;
  detail?: string;
};

const chartColors = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 1)}%`;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusTone(status: string): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (["ACTIVE", "APPROVED", "PAID", "PASSED", "SUCCEEDED", "RESOLVED", "CLOSED"].includes(status)) return "profit";
  if (["FAILED", "REJECTED", "CANCELLED", "SUSPENDED", "REFUNDED"].includes(status)) return "loss";
  if (["PENDING", "OPEN", "IN_PROGRESS"].includes(status)) return "warning";
  return "neutral";
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function makeReportRows(analytics: AdminAnalytics, range: ReportRange) {
  const metrics: ReportRow[] = Object.entries(analytics.metrics).map(([key, value]) => ({ section: "Metrics", name: key, value, amount: "", detail: "" }));
  const statuses = [
    ...analytics.accountStatuses.map((row) => ({ section: "Account Status", name: row.status, value: row.count, amount: row.amount ?? "" })),
    ...analytics.orderStatuses.map((row) => ({ section: "Order Status", name: row.status, value: row.count, amount: row.amount ?? "" })),
    ...analytics.topUpStatuses.map((row) => ({ section: "Top-up Status", name: row.status, value: row.count, amount: row.amount ?? "" })),
    ...analytics.payoutStatuses.map((row) => ({ section: "Payout Status", name: row.status, value: row.count, amount: row.amount ?? "" }))
  ];
  const challenges = analytics.challengePerformance.map((challenge) => ({
    section: "Challenge",
    name: challenge.name,
    value: challenge.orders,
    amount: challenge.revenue,
    detail: `${challenge.phaseCount} phase / ${challenge.accounts} accounts / ${challenge.isActive ? "active" : "hidden"}`
  }));
  const recent = analytics.recentActivity.map((activity) => ({
    section: "Recent Activity",
    name: activity.type,
    value: activity.status,
    amount: activity.amount ?? "",
    detail: `${activity.title} / ${activity.description} / ${formatDateTime(activity.createdAt)}`
  }));

  const rows: ReportRow[] = [
    { section: "Report", name: "Range", value: range.toUpperCase(), amount: "", detail: new Date().toISOString() },
    ...metrics,
    ...statuses,
    ...challenges,
    ...recent
  ];
  return rows;
}

function makeCsv(analytics: AdminAnalytics, range: ReportRange) {
  const rows = makeReportRows(analytics, range);
  return [
    ["Section", "Name", "Value", "Amount", "Detail"].join(","),
    ...rows.map((row) => [row.section, row.name, row.value, row.amount ?? "", row.detail ?? ""].map(escapeCsv).join(","))
  ].join("\n");
}

function makeHtmlReport(analytics: AdminAnalytics, range: ReportRange) {
  const rows = makeReportRows(analytics, range);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Pipnest ${range} report</title></head><body><h1>PipNest Markets ${range.toUpperCase()} Report</h1><p>Generated ${new Date().toLocaleString()}</p><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Section</th><th>Name</th><th>Value</th><th>Amount</th><th>Detail</th></tr></thead><tbody>${rows
    .map((row) => `<tr><td>${row.section}</td><td>${row.name}</td><td>${row.value}</td><td>${row.amount ?? ""}</td><td>${row.detail ?? ""}</td></tr>`)
    .join("")}</tbody></table></body></html>`;
}

function makePdf(analytics: AdminAnalytics, range: ReportRange) {
  const lines = makeReportRows(analytics, range)
    .slice(0, 42)
    .map((row) => `${row.section}: ${row.name} - ${row.value}${row.amount ? ` (${row.amount})` : ""}`);
  const contentLines = [`PipNest Markets ${range.toUpperCase()} Report`, `Generated ${new Date().toLocaleString()}`, "", ...lines];
  const stream = contentLines
    .map((line, index) => `BT /F1 10 Tf 42 ${760 - index * 16} Td (${String(line).replace(/[()\\]/g, "\\$&")}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function StatusList({ title, rows }: { title: string; rows: StatusRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <Badge>{formatNumber(total)}</Badge>
      </div>
      <div className="grid gap-3">
        {rows.length ? (
          rows.map((row) => {
            const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{formatStatus(row.status)}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatNumber(row.count)}
                    {row.amount ? ` / ${currency(row.amount)}` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">No data yet.</div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportRange, setReportRange] = useState<ReportRange>("daily");

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<AdminAnalytics>("/admin/dashboard", { token: authToken });
      setAnalytics(data);
    } catch (error) {
      pushToast({
        title: "Dashboard not loaded",
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

  const accountPie = useMemo(
    () => (analytics?.accountStatuses ?? []).map((row) => ({ name: formatStatus(row.status), value: row.count })),
    [analytics?.accountStatuses]
  );
  const topChallenges = useMemo(() => (analytics?.challengePerformance ?? []).slice(0, 8), [analytics?.challengePerformance]);
  const m = analytics?.metrics;

  function downloadReport(format: "csv" | "pdf" | "doc" | "xlsx") {
    if (!analytics) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const baseName = `pipnest-${reportRange}-report-${stamp}`;
    if (format === "csv") {
      downloadBlob(`${baseName}.csv`, makeCsv(analytics, reportRange), "text/csv;charset=utf-8");
      return;
    }
    if (format === "pdf") {
      downloadBlob(`${baseName}.pdf`, makePdf(analytics, reportRange), "application/pdf");
      return;
    }
    const html = makeHtmlReport(analytics, reportRange);
    if (format === "doc") {
      downloadBlob(`${baseName}.doc`, html, "application/msword;charset=utf-8");
      return;
    }
    downloadBlob(`${baseName}.xlsx`, html, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
  }

  return (
    <>
      <PageHeader
        title="Dashboard & Reports"
        description="Collective platform analytics across traders, revenue, top-ups, payouts, KYC, support, challenges, and trading account outcomes."
        action={
          <div className="flex flex-wrap gap-2">
            <Select
              value={reportRange}
              onChange={(event) => setReportRange(event.target.value as ReportRange)}
              className="w-36"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="annual">Annual</option>
              <option value="yearly">Yearly</option>
            </Select>
            {(["csv", "pdf", "doc", "xlsx"] as const).map((format) => (
              <Button key={format} type="button" variant="secondary" onClick={() => downloadReport(format)} disabled={!analytics}>
                <Download className="h-4 w-4" />
                {format.toUpperCase()}
              </Button>
            ))}
            <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      {loading && !analytics ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : analytics && m ? (
        <div className="grid gap-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard label="Total Traders" value={formatNumber(m.totalTraders)} change={`${formatNumber(m.activeTraders)} active / ${formatNumber(m.pendingTraders)} pending`} icon={Users} tone="primary" />
            <DashboardCard label="Gross Revenue" value={currency(m.grossRevenue)} change={`${currency(m.revenueThisMonth)} this month`} icon={BadgeDollarSign} tone="profit" />
            <DashboardCard label="Pending Payouts" value={currency(m.pendingPayoutAmount)} change={`${formatNumber(m.pendingPayouts)} requests`} icon={Wallet} tone="warning" />
            <DashboardCard label="Open Support" value={formatNumber(m.openTickets)} change={`${formatNumber(m.urgentTickets)} urgent tickets`} icon={Headphones} tone={m.urgentTickets ? "loss" : "primary"} />
            <DashboardCard label="Trading Accounts" value={formatNumber(m.activeAccounts)} change={`${formatNumber(m.pendingAccounts)} pending approvals`} icon={BarChart3} tone="primary" />
            <DashboardCard label="Pass Rate" value={formatPercent(m.passRate)} change={`${formatNumber(m.passedAccounts)} passed / ${formatNumber(m.failedAccounts)} failed`} icon={ShieldCheck} tone="profit" />
            <DashboardCard label="Avg Drawdown" value={formatPercent(m.avgDailyDrawdown)} change={`${formatPercent(m.avgMaxDrawdown)} max average`} icon={Activity} tone="warning" />
            <DashboardCard label="KYC Queue" value={formatNumber(m.pendingKyc)} change={`${formatNumber(m.approvedKyc)} approved profiles`} icon={IdCard} tone={m.pendingKyc ? "warning" : "profit"} />
          </div>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Revenue, Top-ups & Payouts</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Last 14 days across every user account.</p>
                </div>
                <Badge tone="primary">Collective</Badge>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.series}>
                    <defs>
                      <linearGradient id="adminRevenue" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="adminTopUps" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.38} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" fill="url(#adminRevenue)" />
                    <Area type="monotone" dataKey="topUps" name="Top-ups" stroke="#22C55E" fill="url(#adminTopUps)" />
                    <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#F59E0B" fillOpacity={0.08} fill="#F59E0B" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5">
                <h2 className="font-semibold">Account Outcomes</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Current MT4/MT5 lifecycle states.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={accountPie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                      {accountPie.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2">
                {analytics.accountStatuses.map((row, index) => (
                  <div key={row.status} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      {formatStatus(row.status)}
                    </span>
                    <strong>{formatNumber(row.count)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <StatusList title="Orders" rows={analytics.orderStatuses} />
            <StatusList title="Top-ups" rows={analytics.topUpStatuses} />
            <StatusList title="Payouts" rows={analytics.payoutStatuses} />
          </div>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Challenge Performance</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Revenue, order count, and account requests by challenge.</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topChallenges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={70} />
                    <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="orders" name="Orders" fill="#22C55E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 font-semibold">Challenge</th>
                      <th className="py-3 font-semibold">Phase</th>
                      <th className="py-3 font-semibold">Orders</th>
                      <th className="py-3 font-semibold">Accounts</th>
                      <th className="py-3 font-semibold">Revenue</th>
                      <th className="py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {topChallenges.map((challenge) => (
                      <tr key={challenge.id}>
                        <td className="py-3 font-semibold">{challenge.name}</td>
                        <td className="py-3">{challenge.phaseCount} phase</td>
                        <td className="py-3">{formatNumber(challenge.orders)}</td>
                        <td className="py-3">{formatNumber(challenge.accounts)}</td>
                        <td className="py-3 font-semibold">{currency(challenge.revenue)}</td>
                        <td className="py-3"><Badge tone={challenge.isActive ? "profit" : "neutral"}>{challenge.isActive ? "Active" : "Hidden"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Recent Activity</h2>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CheckCircle2 className="h-5 w-5 text-profit" />}
              </div>
              <div className="grid min-w-0 gap-3">
                {analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{activity.type}</div>
                        <div className="mt-1 break-words font-semibold [overflow-wrap:anywhere]">{activity.title}</div>
                        <div className="mt-1 text-sm leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">{activity.description}</div>
                      </div>
                      <Badge tone={statusTone(activity.status)} className="shrink-0">{formatStatus(activity.status)}</Badge>
                    </div>
                    <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="min-w-0 break-words">{formatDateTime(activity.createdAt)}</span>
                      {activity.amount ? <strong className="shrink-0 text-slate-700 dark:text-slate-200">{currency(activity.amount)}</strong> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
          Dashboard data is not available yet.
        </div>
      )}
    </>
  );
}
