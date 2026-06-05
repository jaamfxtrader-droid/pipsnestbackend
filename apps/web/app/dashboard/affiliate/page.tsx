"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Copy, Loader2, Share2, Users, Waypoints } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCodeCard } from "@/components/ui/qr-code-card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRememberedAuth, useAuthStore, type AuthUser } from "@/store/auth-store";

type AffiliateSummary = {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  commission: number;
};

type AffiliateReferral = {
  id: string;
  commissionRate: number;
  commissionAmount: string | number;
  status: "PENDING" | "ACTIVE" | "PAID" | "CANCELLED";
  createdAt: string;
  convertedAt?: string | null;
  referredUser: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    createdAt?: string;
  };
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not converted";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function statusClass(status: AffiliateReferral["status"]) {
  if (status === "PAID") return "bg-profit/10 text-green-700 dark:text-green-300";
  if (status === "ACTIVE") return "bg-primary/10 text-blue-700 dark:text-blue-300";
  if (status === "CANCELLED") return "bg-loss/10 text-red-700 dark:text-red-300";
  return "bg-warning/10 text-amber-700 dark:text-amber-300";
}

export default function AffiliateDashboardPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const setAuth = useAuthStore((state) => state.setAuth);
  const pushToast = useToast((state) => state.push);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AffiliateSummary | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  useEffect(() => {
    if (scope !== "user" || !token) return;

    apiFetch<{ user: AuthUser }>("/auth/me", { token })
      .then((data) => setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" }))
      .catch(() => undefined);
  }, [scope, setAuth, token]);

  useEffect(() => {
    if (scope !== "user" || !token) return;

    let active = true;
    setLoading(true);
    Promise.all([
      apiFetch<AffiliateSummary>("/affiliate/me", { token }),
      apiFetch<{ referrals: AffiliateReferral[] }>("/affiliate/referrals", { token })
    ])
      .then(([summaryData, referralData]) => {
        if (!active) return;
        setSummary(summaryData);
        setReferrals(referralData.referrals);
      })
      .catch((error) => {
        pushToast({
          title: "Affiliate data not loaded",
          message: error instanceof Error ? error.message : "Please refresh and try again.",
          tone: "error"
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pushToast, scope, token]);

  const activeReferrals = useMemo(() => referrals.filter((referral) => referral.status === "ACTIVE").length, [referrals]);
  const paidReferrals = useMemo(() => referrals.filter((referral) => referral.status === "PAID").length, [referrals]);
  const referralUrl = summary?.referralUrl ?? "Referral URL loading";

  async function copyReferralUrl() {
    await navigator.clipboard.writeText(referralUrl);
    pushToast({ title: "Referral URL copied", message: "You can share it with traders now.", tone: "success" });
  }

  async function shareReferralUrl() {
    if (navigator.share && summary) {
      await navigator.share({
        title: "PipNest Markets referral",
        text: "Join PipNest Markets with my referral link.",
        url: referralUrl
      });
      return;
    }
    await copyReferralUrl();
  }

  return (
    <>
      <PageHeader title="Affiliate Dashboard" description="Referral link, conversion count, and commission summary from your account data." />

      <div className="grid gap-5 md:grid-cols-3">
        <DashboardCard label="Total Referrals" value={String(summary?.totalReferrals ?? referrals.length)} change={`${activeReferrals} active conversions`} icon={Users} tone="primary" />
        <DashboardCard label="Commission" value={formatCurrency(summary?.commission ?? 0)} change={`${paidReferrals} paid referrals`} icon={BadgeDollarSign} tone="profit" />
        <DashboardCard label="Referral Code" value={summary?.referralCode ?? "..."} change="Unique to your account" icon={Waypoints} tone="warning" />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Referral URL</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Share this link so new traders are tracked under your affiliate account.</p>
          </div>
          <Button type="button" variant="secondary" onClick={shareReferralUrl} disabled={!summary}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="relative min-w-0">
            <Input value={referralUrl} readOnly className="pr-12 font-semibold" />
            <button
              type="button"
              onClick={copyReferralUrl}
              disabled={!summary}
              className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-primary transition hover:bg-primary/10 disabled:opacity-50"
              aria-label="Copy referral URL"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <QrCodeCard
            title="Referral QR"
            value={summary?.referralUrl ?? ""}
            fileName="pipnest-referral-qr.png"
            shareText="PipNest Markets referral link"
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
          <div>
            <h2 className="font-semibold">Referral ledger</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Every referred trader linked to your code.</p>
          </div>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CheckCircle2 className="h-5 w-5 text-profit" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Trader</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Rate</th>
                <th className="px-5 py-3 font-semibold">Commission</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Converted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {referrals.map((referral) => (
                <tr key={referral.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{referral.referredUser.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{referral.referredUser.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", statusClass(referral.status))}>{referral.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-4 font-medium">{referral.commissionRate}%</td>
                  <td className="px-5 py-4 font-semibold">{formatCurrency(referral.commissionAmount)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(referral.createdAt)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(referral.convertedAt)}</td>
                </tr>
              ))}
              {!loading && referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    No referred traders yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
