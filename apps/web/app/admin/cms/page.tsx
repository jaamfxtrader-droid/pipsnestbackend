"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Check,
  ChevronDown,
  Facebook,
  Github,
  ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Music2,
  Plus,
  Save,
  Send,
  Trash2,
  Trophy,
  Twitter,
  Upload,
  Youtube
} from "lucide-react";
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

const socialPlatforms = [
  { type: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbrand", Icon: Instagram },
  { type: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbrand", Icon: Facebook },
  { type: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourbrand", Icon: Youtube },
  { type: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourbrand", Icon: Linkedin },
  { type: "telegram", label: "Telegram", placeholder: "https://t.me/yourbrand", Icon: Send },
  { type: "x", label: "X / Twitter", placeholder: "https://x.com/yourbrand", Icon: Twitter },
  { type: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourbrand", Icon: Music2 },
  { type: "discord", label: "Discord", placeholder: "https://discord.gg/yourbrand", Icon: Send },
  { type: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/15551234567", Icon: Send },
  { type: "github", label: "GitHub", placeholder: "https://github.com/yourbrand", Icon: Github }
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function SocialPlatformSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = socialPlatforms.find((platform) => platform.type === value) ?? socialPlatforms[0];
  const SelectedIcon = selected.Icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-md border border-slate-300/50 bg-white px-3 text-left text-sm font-black text-slate-900 transition hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open ? "rotate-180" : "rotate-0")} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-2xl dark:border-white/10 dark:bg-slate-950">
          {socialPlatforms.map((platform) => {
            const Icon = platform.Icon;
            const active = platform.type === value;

            return (
              <button
                key={platform.type}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(platform.type);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-10 w-full items-center justify-between gap-3 rounded px-3 text-left text-sm font-semibold transition",
                  active
                    ? "bg-primary text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{platform.label}</span>
                </span>
                {active ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SwitchTile({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 text-left text-sm font-black text-slate-800 transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
    >
      <span className="truncate">{label}</span>
      <span className={cn("inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition", checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700")}>
        <span className={cn("h-4 w-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </span>
    </button>
  );
}

function CollapsibleSettingsPanel({
  title,
  description,
  open,
  onToggle,
  children
}: {
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-visible rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Close ${title}` : `Open ${title}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform", open ? "rotate-180" : "rotate-0")} />
        </button>
      </div>
      <div className={cn("grid transition-all duration-300 ease-in-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className={cn("min-h-0", open ? "overflow-visible" : "overflow-hidden")}>
          <div className="border-t border-slate-200 p-4 dark:border-white/10">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SiteSettingsPanel() {
  const pushToast = useToast((state) => state.push);
  const token = getStoredAuthToken("admin");
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSettings, setOpenSettings] = useState({ stores: false, social: false });

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

  function getSocialPlatform(type: string) {
    return socialPlatforms.find((platform) => platform.type === type) ?? socialPlatforms[0];
  }

  function syncLegacySocialLinks(items: SiteSettings["socialItems"]) {
    return {
      instagram: items.find((item) => item.type === "instagram")?.url ?? settings.socialLinks.instagram,
      youtube: items.find((item) => item.type === "youtube")?.url ?? settings.socialLinks.youtube,
      linkedin: items.find((item) => item.type === "linkedin")?.url ?? settings.socialLinks.linkedin,
      telegram: items.find((item) => item.type === "telegram")?.url ?? settings.socialLinks.telegram
    };
  }

  function updateSocialItem(index: number, patch: Partial<SiteSettings["socialItems"][number]>) {
    setSettings((current) => ({
      ...current,
      socialItems: current.socialItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextType = patch.type ?? item.type;
        const platform = getSocialPlatform(nextType);
        return {
          ...item,
          ...patch,
          type: nextType,
          label: patch.type && (!patch.label || patch.label === item.label) ? platform.label : patch.label ?? item.label
        };
      })
    }));
  }

  function addSocialItem(type = "instagram") {
    const platform = getSocialPlatform(type);
    setSettings((current) => ({
      ...current,
      socialItems: [
        ...current.socialItems,
        {
          id: `${type}-${Date.now()}`,
          type,
          label: platform.label,
          url: "",
          enabled: true
        }
      ]
    }));
  }

  function removeSocialItem(index: number) {
    setSettings((current) => ({
      ...current,
      socialItems: current.socialItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleStoreBadgeUpload(key: "androidBadgeImageUrl" | "iosBadgeImageUrl", file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 600_000) {
      pushToast({ title: "Image is too large", message: "Please upload a compressed store badge image under 600KB.", tone: "error" });
      return;
    }
    setSettings((current) => ({ ...current, [key]: dataUrl }));
  }

  async function saveSettings() {
    if (!token) return;

    setSaving(true);
    try {
      const payload = {
        ...settings,
        socialLinks: syncLegacySocialLinks(settings.socialItems)
      };

      await apiFetch<{ page: CmsPage }>("/admin/cms", {
        method: "POST",
        token,
        body: JSON.stringify({
          slug: "site-settings",
          title: "Site Settings",
          content: JSON.stringify(payload, null, 2),
          metaTitle: "Site Settings",
          metaDescription: "Footer social media, store badges, and app download links.",
          published: true,
          sections: []
        })
      });

      setSettings(payload);

      pushToast({
        title: "Site settings saved",
        message: "Footer app badges and social media links have been updated.",
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

      <div className="mt-5 grid gap-5">
        <CollapsibleSettingsPanel
          title="Store badges and app links"
          description="Manage Play Store and App Store URLs, custom badge images, visibility, and coming soon state."
          open={openSettings.stores}
          onToggle={() => setOpenSettings((current) => ({ ...current, stores: !current.stores }))}
        >
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            {
              title: "Google Play / Android",
              urlKey: "androidAppUrl" as const,
              enabledKey: "androidAppEnabled" as const,
              comingSoonKey: "androidAppComingSoon" as const,
              imageKey: "androidBadgeImageUrl" as const,
              defaultImage: "/play-store-badge.svg",
              enabledLabel: "Show Play Store",
              comingSoonLabel: "Play Store coming soon"
            },
            {
              title: "Apple App Store / iOS",
              urlKey: "iosAppUrl" as const,
              enabledKey: "iosAppEnabled" as const,
              comingSoonKey: "iosAppComingSoon" as const,
              imageKey: "iosBadgeImageUrl" as const,
              defaultImage: "/app-store-badge.svg",
              enabledLabel: "Show App Store",
              comingSoonLabel: "App Store coming soon"
            }
          ].map((store) => (
            <div key={store.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{store.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload a custom badge or keep the default store image.</p>
                </div>
                <div className="relative inline-flex min-h-[3.75rem] min-w-[11rem] items-center justify-center rounded-md border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950/40">
                  {settings[store.imageKey] ? (
                    <img src={settings[store.imageKey]} alt={`${store.title} badge preview`} className="max-h-12 max-w-[10rem] object-contain" />
                  ) : (
                    <img src={store.defaultImage} alt={`${store.title} badge preview`} className="max-h-12 max-w-[10rem] object-contain" />
                  )}
                </div>
              </div>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Store URL</span>
                <Input value={settings[store.urlKey]} onChange={(event) => setSettings((current) => ({ ...current, [store.urlKey]: event.target.value }))} />
              </label>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SwitchTile
                  checked={settings[store.enabledKey]}
                  label={store.enabledLabel}
                  onChange={(checked) => setSettings((current) => ({ ...current, [store.enabledKey]: checked }))}
                />
                <SwitchTile
                  checked={settings[store.comingSoonKey]}
                  label={store.comingSoonLabel}
                  onChange={(checked) => setSettings((current) => ({ ...current, [store.comingSoonKey]: checked }))}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                  <Upload className="h-4 w-4" />
                  Upload badge
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      void handleStoreBadgeUpload(store.imageKey, event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={() => setSettings((current) => ({ ...current, [store.imageKey]: "" }))}>
                  <ImageIcon className="h-4 w-4" />
                  Default
                </Button>
              </div>
            </div>
          ))}
        </div>
        </CollapsibleSettingsPanel>

        <CollapsibleSettingsPanel
          title="Social media links"
          description="Pick social platform types, add links, and enable only the icons that should appear in the footer."
          open={openSettings.social}
          onToggle={() => setOpenSettings((current) => ({ ...current, social: !current.social }))}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Footer social channels</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enabled items will show as icons on the public footer.</p>
            </div>
            <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={() => addSocialItem()}>
              <Plus className="h-4 w-4" />
              Add social
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {settings.socialItems.map((social, index) => {
              const platform = getSocialPlatform(social.type);
              const Icon = platform.Icon;

              return (
                <div
                  key={social.id}
                  className={cn(
                    "grid min-w-0 gap-3 rounded-lg border p-3 xl:grid-cols-[minmax(0,14rem)_minmax(0,12rem)_minmax(16rem,1fr)_auto] xl:items-end",
                    social.enabled
                      ? "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/30"
                      : "border-slate-200 bg-slate-100 opacity-70 dark:border-white/10 dark:bg-white/[0.03]"
                  )}
                >
                  <label className="grid min-w-0 gap-2 text-sm font-semibold">
                    <span>Platform type</span>
                    <SocialPlatformSelect value={social.type} onChange={(type) => updateSocialItem(index, { type })} />
                  </label>
                  <label className="grid min-w-0 gap-2 text-sm font-semibold">
                    <span>Icon label</span>
                    <Input value={social.label} onChange={(event) => updateSocialItem(index, { label: event.target.value })} />
                  </label>
                  <label className="grid min-w-0 gap-2 text-sm font-semibold">
                    <span>Social URL</span>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input value={social.url} onChange={(event) => updateSocialItem(index, { url: event.target.value })} placeholder={platform.placeholder} className="pl-9" />
                    </div>
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-2 xl:flex xl:justify-end">
                    <button
                      type="button"
                      onClick={() => updateSocialItem(index, { enabled: !social.enabled })}
                      className={cn(
                        "inline-flex h-10 min-w-0 items-center justify-center rounded-md border px-3 text-sm font-black transition",
                        social.enabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                      )}
                    >
                      {social.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSocialItem(index)}
                      className="inline-flex h-10 w-11 items-center justify-center rounded-md border border-red-200 bg-red-50 text-sm font-black text-red-700 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSettingsPanel>
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
