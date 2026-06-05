"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign, BarChart3, CheckCircle2, Loader2, Save, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { CmsPage } from "@/lib/cms";
import { defaultSiteSettings, parseSiteSettingsContent, type SiteSettings } from "@/lib/site-settings";
import { cn, currency } from "@/lib/utils";
import { getStoredAuthToken } from "@/store/auth-store";
import AdvancedCmsEditor from "./advanced-editor";

type HomeMetricsPreview = {
  totals: {
    activeChallenges: number;
    approvedUsers: number;
    paidOrders: number;
    activeAccounts: number;
    payoutAmount: number;
    revenueAmount: number;
    topAllocation: number;
    fastestDays: number;
  };
};

const homeMetricsPreviewFallback: HomeMetricsPreview = {
  totals: {
    activeChallenges: 0,
    approvedUsers: 0,
    paidOrders: 0,
    activeAccounts: 0,
    payoutAmount: 0,
    revenueAmount: 0,
    topAllocation: 0,
    fastestDays: 0
  }
};

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: Math.abs(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function SiteSettingsPanel() {
  const pushToast = useToast((state) => state.push);
  const token = getStoredAuthToken("admin");
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<{ pages: CmsPage[] }>("/admin/cms", { token })
      .then((data) => {
        const settingsPage = data.pages.find((page) => page.slug === "site-settings");
        setSettings(parseSiteSettingsContent(settingsPage?.content));
      })
      .catch(() => setSettings(defaultSiteSettings))
      .finally(() => setLoading(false));
  }, [token]);

  function updateSocialLink(key: keyof SiteSettings["socialLinks"], value: string) {
    setSettings((current) => ({
      ...current,
      socialLinks: {
        ...current.socialLinks,
        [key]: value
      }
    }));
  }

  async function saveSettings() {
    if (!token) return;

    setSaving(true);
    try {
      await apiFetch<{ page: CmsPage }>("/admin/cms", {
        method: "POST",
        token,
        body: JSON.stringify({
          slug: "site-settings",
          title: "Site Settings",
          content: JSON.stringify(settings, null, 2),
          metaTitle: "Site Settings",
          metaDescription: "Footer social media and app download links.",
          published: true,
          sections: []
        })
      });

      pushToast({
        title: "Site settings saved",
        message: "Footer Play Store and social media links have been updated.",
        tone: "success"
      });
    } catch (error) {
      pushToast({
        title: "Failed to save settings",
        message: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Footer App & Social Links</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update the footer Play Store badge link and social media icons shown on the public website.
          </p>
        </div>
        <Button type="button" onClick={saveSettings} disabled={loading || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save links
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Google Play / Android app URL</span>
          <Input value={settings.androidAppUrl} onChange={(event) => setSettings((current) => ({ ...current, androidAppUrl: event.target.value }))} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Instagram URL</span>
          <Input value={settings.socialLinks.instagram} onChange={(event) => updateSocialLink("instagram", event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">YouTube URL</span>
          <Input value={settings.socialLinks.youtube} onChange={(event) => updateSocialLink("youtube", event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">LinkedIn URL</span>
          <Input value={settings.socialLinks.linkedin} onChange={(event) => updateSocialLink("linkedin", event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telegram URL</span>
          <Input value={settings.socialLinks.telegram} onChange={(event) => updateSocialLink("telegram", event.target.value)} />
        </label>
      </div>
    </div>
  );
}

export default function CmsPageManagementPage() {
  const pushToast = useToast((state) => state.push);
  const [homeMetrics, setHomeMetrics] = useState<HomeMetricsPreview>(homeMetricsPreviewFallback);
  const [selectedPage, setSelectedPage] = useState<string>("home");

  useEffect(() => {
    apiFetch<HomeMetricsPreview>("/cms/home-metrics")
      .then((data) => setHomeMetrics(data))
      .catch(() => setHomeMetrics(homeMetricsPreviewFallback));
  }, []);

  return (
    <>
      <PageHeader
        title="CMS Pages Management"
        description="Edit every page section, manage content, and publish changes using the advanced editor below."
      />

      <SiteSettingsPanel />

      {selectedPage === "home" && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Home DB Data Preview</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Trader Journey and Rewards cards on the main front page read these live database totals.
              </p>
            </div>
            <Badge tone="primary">Linked to front</Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active challenges", value: compact(homeMetrics.totals.activeChallenges), helper: "Challenge records", Icon: Trophy, tone: "primary" as const },
              { label: "Approved traders", value: compact(homeMetrics.totals.approvedUsers), helper: "Verified users", Icon: CheckCircle2, tone: "profit" as const },
              { label: "Reward pipeline", value: currency(homeMetrics.totals.payoutAmount), helper: "Payout requests", Icon: BadgeDollarSign, tone: "warning" as const },
              { label: "Revenue tracked", value: currency(homeMetrics.totals.revenueAmount), helper: "Succeeded payments", Icon: BarChart3, tone: "neutral" as const }
            ].map((item) => {
              const Icon = item.Icon;

              return (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                    <Badge tone={item.tone} className="h-9 w-9 justify-center p-0">
                      <Icon className="h-4 w-4" />
                    </Badge>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.helper}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AdvancedCmsEditor />
    </>
  );
}
