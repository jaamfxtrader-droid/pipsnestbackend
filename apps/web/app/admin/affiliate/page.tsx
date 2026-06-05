"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Loader2, Megaphone, RefreshCw, TrendingUp, Users, Waypoints } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type AffiliateStatus = "PENDING" | "ACTIVE" | "PAID" | "CANCELLED";

type AffiliateUser = Pick<AuthUser, "id" | "name" | "email" | "username" | "avatarUrl"> & {
  referralCode?: string;
  createdAt?: string;
};

type AffiliateReferral = {
  id: string;
  referrerId: string;
  referredUserId: string;
  commissionRate: number;
  commissionAmount: string | number;
  status: AffiliateStatus;
  createdAt: string;
  convertedAt?: string | null;
  referrer: AffiliateUser;
  referredUser: AffiliateUser;
};

type TopReferrer = {
  referrer: AffiliateUser;
  totalReferrals: number;
  activeReferrals: number;
  paidReferrals: number;
  commission: number;
};

type AffiliatePayload = {
  summary: {
    totalReferrals: number;
    pendingReferrals: number;
    activeReferrals: number;
    paidReferrals: number;
    cancelledReferrals: number;
    totalCommission: number;
    unpaidCommission: number;
    paidCommission: number;
  };
  topReferrers: TopReferrer[];
  referrals: AffiliateReferral[];
};

function statusTone(status: AffiliateStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "PAID") return "profit";
  if (status === "ACTIVE") return "primary";
  if (status === "CANCELLED") return "loss";
  return "warning";
}

function formatDate(value?: string | null) {
  if (!value) return "Not converted";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminAffiliatePage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [data, setData] = useState<AffiliatePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const affiliateData = await apiFetch<AffiliatePayload>("/admin/affiliate", { token: authToken });
      setData(affiliateData);
    } catch (error) {
      pushToast({
        title: "Affiliate data not loaded",
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

  const summary = data?.summary;
  const statusRows = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Pending", value: summary.pendingReferrals, tone: "warning" as const },
      { label: "Active", value: summary.activeReferrals, tone: "primary" as const },
      { label: "Paid", value: summary.paidReferrals, tone: "profit" as const },
      { label: "Cancelled", value: summary.cancelledReferrals, tone: "loss" as const }
    ];
  }, [summary]);

  return (
    <>
      <PageHeader
        title="Affiliate Management"
        description="Live referral conversions, commission totals, top referrers, and payout-ready affiliate records from the database."
        action={
          <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      {loading && !data ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data && summary ? (
        <div className="grid gap-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard label="Total Referrals" value={String(summary.totalReferrals)} change={`${summary.activeReferrals} active conversions`} icon={Users} tone="primary" />
            <DashboardCard label="Total Commission" value={currency(summary.totalCommission)} change="All tracked affiliate value" icon={BadgeDollarSign} tone="profit" />
            <DashboardCard label="Unpaid Commission" value={currency(summary.unpaidCommission)} change="Active referrals pending payout" icon={TrendingUp} tone="warning" />
            <DashboardCard label="Paid Commission" value={currency(summary.paidCommission)} change={`${summary.paidReferrals} paid referrals`} icon={CheckCircle2} tone="profit" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center gap-3">
                <Waypoints className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Top Referrers</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ranked by commission first, then referral count.</p>
                </div>
              </div>

              <div className="grid gap-3">
                {data.topReferrers.length ? (
                  data.topReferrers.map((row, index) => (
                    <div key={row.referrer.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Rank #{index + 1}</div>
                          <h3 className="mt-1 truncate font-semibold">{row.referrer.name}</h3>
                          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{row.referrer.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{currency(row.commission)}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{row.totalReferrals} referrals</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-950">Active {row.activeReferrals}</span>
                        <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-950">Paid {row.paidReferrals}</span>
                        <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-950">{row.referrer.referralCode ?? "No code"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">No affiliate referrals yet.</div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Referral Status</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current lifecycle for every referral.</p>
                </div>
              </div>
              <div className="grid gap-3">
                {statusRows.map((row) => {
                  const percent = summary.totalReferrals > 0 ? Math.round((row.value / summary.totalReferrals) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{row.label}</span>
                        <Badge tone={row.tone}>{row.value}</Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
              <div>
                <h2 className="font-semibold">Affiliate Ledger</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Every referred trader, referrer, conversion state, rate, and commission amount.</p>
              </div>
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CheckCircle2 className="h-5 w-5 text-profit" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Referrer</th>
                    <th className="px-5 py-3 font-semibold">Referred Trader</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Rate</th>
                    <th className="px-5 py-3 font-semibold">Commission</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                    <th className="px-5 py-3 font-semibold">Converted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {data.referrals.map((referral) => (
                    <tr key={referral.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                      <td className="px-5 py-4">
                        <div className="font-semibold">{referral.referrer.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{referral.referrer.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold">{referral.referredUser.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{referral.referredUser.email}</div>
                      </td>
                      <td className="px-5 py-4"><Badge tone={statusTone(referral.status)}>{formatStatus(referral.status)}</Badge></td>
                      <td className="px-5 py-4 font-medium">{referral.commissionRate}%</td>
                      <td className="px-5 py-4 font-semibold">{currency(referral.commissionAmount)}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(referral.createdAt)}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(referral.convertedAt)}</td>
                    </tr>
                  ))}
                  {data.referrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                        No referred traders yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
          Affiliate data is not available yet.
        </div>
      )}
    </>
  );
}
