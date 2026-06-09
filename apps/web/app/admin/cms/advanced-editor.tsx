"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Grid3x3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Plus,
  Save,
  Settings,
  CheckCircle2,
  Strikethrough,
  Trash2,
  Type,
  ChevronUp,
  ChevronDown,
  Copy,
  AlertCircle,
  ExternalLink,
  FileVideo,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  DollarSign,
  Smartphone,
  Target,
  Tablet,
  Monitor,
  Navigation,
  Search,
  Upload,
  Badge as BadgeIcon,
  X,
  FileText,
  Globe2,
  Layers,
  ShieldCheck,
  Clock3,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CmsSectionRenderer } from "@/components/cms/cms-section-renderer";
import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { AffiliateMarketingPage } from "@/components/marketing/affiliate-marketing-page";
import { FaqList } from "@/components/marketing/faq-list";
import { HowItWorksMarketingPage } from "@/components/marketing/how-it-works-marketing-page";
import { PayoutsMarketingPage } from "@/components/marketing/payouts-marketing-page";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStoredAuthToken } from "@/store/auth-store";
import { cmsPageDrafts, mergeCmsPage, type CmsPage, type CmsSection } from "@/lib/cms";
import {
  affiliateIconOptions,
  defaultAffiliatePageContent,
  parseAffiliatePageContent,
  type AffiliateCard,
  type AffiliateCta,
  type AffiliateIconName,
  type AffiliateMetric
} from "@/lib/affiliate-page-content";
import { defaultCmsFaqItems, parseFaqItems, type CmsFaqItem } from "@/lib/faq-page-content";
import {
  defaultFundingPageContent,
  fundingIconOptions,
  parseFundingPageContent,
  type FundingCta,
  type FundingFeatureItem,
  type FundingHeroStat,
  type FundingIconName
} from "@/lib/funding-page-content";
import {
  defaultPayoutsPageContent,
  parsePayoutsPageContent,
  payoutIconOptions,
  type PayoutCard,
  type PayoutCta,
  type PayoutIconName,
  type PayoutMetric
} from "@/lib/payouts-page-content";
import {
  defaultHowItWorksPageContent,
  howIconOptions,
  parseHowItWorksPageContent,
  type HowCta,
  type HowIconName,
  type HowMetric,
  type HowStep
} from "@/lib/how-it-works-page-content";
import {
  accountDeletionSections,
  aboutSections,
  challengeRulesSections,
  disclaimerSections,
  kycSections,
  privacySections,
  refundSections,
  riskSections,
  termsSections,
  type LegalSection
} from "@/lib/legal-content";

type EditorTab = "content" | "seo" | "styling" | "preview";
type SectionType = "block" | "grid" | "flex" | "carousel" | "media" | "split";
type PreviewDevice =
  | "desktop-1920"
  | "desktop-1440"
  | "desktop-1366"
  | "desktop-1024"
  | "tablet-1024"
  | "tablet-834"
  | "tablet-768"
  | "mobile-430"
  | "mobile-390"
  | "mobile-360";
type ThemeMode = "light" | "dark" | "both";

const previewPresets: Array<{ group: "Desktop" | "Tablet" | "Mobile"; device: PreviewDevice; icon: typeof Monitor; label: string; width: number; height: number }> = [
  { group: "Desktop", device: "desktop-1920", icon: Monitor, label: "1920x1080", width: 1920, height: 1080 },
  { group: "Desktop", device: "desktop-1440", icon: Monitor, label: "1440x900", width: 1440, height: 900 },
  { group: "Desktop", device: "desktop-1366", icon: Monitor, label: "1366x768", width: 1366, height: 768 },
  { group: "Desktop", device: "desktop-1024", icon: Monitor, label: "1024x768", width: 1024, height: 768 },
  { group: "Tablet", device: "tablet-1024", icon: Tablet, label: "1024x1366", width: 1024, height: 1366 },
  { group: "Tablet", device: "tablet-834", icon: Tablet, label: "834x1194", width: 834, height: 1194 },
  { group: "Tablet", device: "tablet-768", icon: Tablet, label: "768x1024", width: 768, height: 1024 },
  { group: "Mobile", device: "mobile-430", icon: Smartphone, label: "430x932", width: 430, height: 932 },
  { group: "Mobile", device: "mobile-390", icon: Smartphone, label: "390x844", width: 390, height: 844 },
  { group: "Mobile", device: "mobile-360", icon: Smartphone, label: "360x800", width: 360, height: 800 }
];

const maxCmsImageBytes = 700 * 1024;

const fixedPageNames: Record<string, string> = {
  home: "Landing Page / Home Page",
  about: "About Page",
  contact: "Contact Page",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  disclaimer: "Disclaimers",
  "kyc-policy": "KYC Policy Page",
  "refund-policy": "Refund Policy",
  "risk-disclosure": "Risk Disclosure",
  "account-deletion": "Account Deletion",
  affiliate: "Affiliate Rules Page",
  "challenge-details": "Rules",
  "funding-programs": "Funding",
  faq: "FAQ"
};

const editableSlugs = Object.keys(fixedPageNames);

const legalPreviewConfig: Record<string, { eyebrow?: string; fallback: LegalSection[] }> = {
  about: { eyebrow: "About", fallback: aboutSections },
  "challenge-details": { eyebrow: "Rules", fallback: challengeRulesSections },
  terms: { eyebrow: "Legal", fallback: termsSections },
  privacy: { eyebrow: "Privacy", fallback: privacySections },
  disclaimer: { eyebrow: "Disclosure", fallback: disclaimerSections },
  "kyc-policy": { eyebrow: "Compliance", fallback: kycSections },
  "risk-disclosure": { eyebrow: "Risk", fallback: riskSections },
  "refund-policy": { eyebrow: "Payments", fallback: refundSections },
  "account-deletion": { fallback: accountDeletionSections }
};

const fundingIconMap: Record<FundingIconName, typeof Trophy> = {
  Trophy,
  BadgeDollarSign,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Target,
  DollarSign
};

function pageDisplayName(page: CmsPage) {
  return fixedPageNames[page.slug] ?? page.metadata?.navLabel ?? page.title ?? page.slug;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function pagePublicHref(page?: CmsPage | null) {
  if (!page) return "/";
  if (page.slug === "home") return "/";
  return `/${page.slug}`;
}

function formatUpdatedAt(value?: string) {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not saved yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function getPageHealth(page: CmsPage) {
  const sections = page.sections ?? [];
  const visibleSections = sections.filter((section) => section.published !== false && section.isVisible !== false);
  const issues = [
    !page.metaTitle ? "SEO title missing" : "",
    !page.metaDescription ? "SEO description missing" : "",
    visibleSections.length === 0 ? "No visible sections" : "",
    sections.some((section) => !section.title?.trim() || !section.content?.trim()) ? "Section copy incomplete" : ""
  ].filter(Boolean);

  return {
    issues,
    score: Math.max(0, 100 - issues.length * 25),
    tone: issues.length === 0 ? "Ready" : issues.length <= 2 ? "Review" : "Needs work"
  };
}

function getSectionScore(section?: CmsSection) {
  if (!section) return { score: 0, label: "No section", issues: ["No section selected"] };
  const issues = [
    !section.label?.trim() ? "Label missing" : "",
    !section.title?.trim() ? "Title missing" : "",
    !section.content?.trim() ? "Description missing" : "",
    section.content?.trim() && section.content.trim().length < 40 ? "Description is short" : "",
    section.published === false || section.isVisible === false ? "Hidden from page" : ""
  ].filter(Boolean);
  const score = Math.max(0, 100 - issues.length * 20);
  return { score, label: issues.length ? "Needs review" : "Strong", issues };
}

function publishLabel(published?: boolean) {
  return published === false ? "Draft" : "Published";
}

function SwitchControl({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-900 dark:text-white">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span> : null}
      </span>
      <span className={cn("inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition", checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700")}>
        <span className={cn("h-5 w-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </span>
    </button>
  );
}

function CustomSelect({
  value,
  options,
  onChange,
  className
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-semibold text-slate-900 transition hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open ? "rotate-180" : "rotate-0")} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-2xl dark:border-white/10 dark:bg-slate-950">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex h-10 w-full items-center justify-between gap-3 rounded px-3 text-left text-sm font-semibold transition",
                option.value === value ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CmsEditorSkeleton() {
  const statCards = ["", "", "", ""];
  const pagePills = ["", "", "", "", ""];
  const sectionRows = ["", "", "", "", ""];

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950 lg:min-h-[calc(100dvh-8rem)]">
      <div className="border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02] sm:p-4">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-8 w-8 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="mt-3 h-7 w-14 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
          <div className="grid gap-3 xl:flex xl:items-center xl:justify-between">
            <div className="h-11 min-w-0 flex-1 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-wrap gap-2 xl:ml-4">
              <div className="h-10 w-28 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
              <div className="h-10 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
              <div className="h-10 w-28 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 overflow-hidden pb-1">
            {pagePills.map((_, index) => (
              <div key={index} className="h-16 min-w-[13rem] animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02] lg:border-b-0 lg:border-r">
          <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="mt-4 space-y-3">
            {sectionRows.map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
            ))}
          </div>
        </aside>
        <section className="min-w-0 bg-white p-4 dark:bg-slate-950 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
              <div className="h-11 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
              <div className="h-40 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-24 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
                <div className="h-24 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
              <div className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function LiveCmsPagePreview({
  page,
  selectedIndex,
  onSelectSection
}: {
  page: CmsPage;
  selectedIndex: number;
  onSelectSection: (index: number) => void;
}) {
  const sections = page.sections ?? [];
  const legalConfig = legalPreviewConfig[page.slug];

  if (!sections.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-slate-950">
        <h3 className="text-xl font-black text-slate-950 dark:text-white">No sections on this page</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add a section, then edit it in the same live preview flow.</p>
      </div>
    );
  }

  if (legalConfig) {
    return (
      <div className="bg-[#061126] text-white">
        <LegalPage
          title={page.title}
          eyebrow={legalConfig.eyebrow}
          summary={page.content}
          sections={cmsLegalSections(page, legalConfig.fallback)}
          selectedSectionIndex={selectedIndex}
          onSectionSelect={onSelectSection}
        />
      </div>
    );
  }

  if (page.slug === "funding-programs") {
    return <FundingCmsLivePreview page={page} selectedIndex={selectedIndex} onSelectSection={onSelectSection} />;
  }

  if (page.slug === "faq") {
    return <FaqCmsLivePreview page={page} selectedIndex={selectedIndex} onSelectSection={onSelectSection} />;
  }

  if (page.slug === "affiliate") {
    return <AffiliateCmsLivePreview page={page} selectedIndex={selectedIndex} onSelectSection={onSelectSection} />;
  }

  if (page.slug === "payouts") {
    return <PayoutsCmsLivePreview page={page} selectedIndex={selectedIndex} onSelectSection={onSelectSection} />;
  }

  if (page.slug === "how-it-works") {
    return <HowItWorksCmsLivePreview page={page} selectedIndex={selectedIndex} onSelectSection={onSelectSection} />;
  }

  return (
    <div className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      {sections.map((section, index) => {
        const selected = selectedIndex === index;
        const hidden = section.published === false || section.isVisible === false;

        return (
          <div
            key={section.sectionKey || index}
            className={cn(
              "group relative border-2 transition",
              selected ? "border-primary" : "border-transparent hover:border-primary/40",
              hidden && "opacity-60"
            )}
          >
            <div className="pointer-events-none">
              <CmsSectionRenderer section={{ ...section, published: true, isVisible: true }} />
            </div>
            <button
              type="button"
              onClick={() => onSelectSection(index)}
              className={cn(
                "absolute left-3 top-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-xs font-black shadow-lg transition",
                selected ? "bg-primary text-white" : "bg-slate-950/85 text-white opacity-90 group-hover:opacity-100"
              )}
            >
              <span className="rounded bg-white/20 px-1.5 py-0.5">{index + 1}</span>
              <span className="truncate">{section.label || section.title || "Section"}</span>
              {hidden ? <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] text-slate-950">Hidden/Draft</span> : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function HowItWorksCmsLivePreview({
  page,
  selectedIndex,
  onSelectSection
}: {
  page: CmsPage;
  selectedIndex: number;
  onSelectSection: (index: number) => void;
}) {
  const intro = page.sections?.[0];
  const steps = page.sections?.[1];

  return (
    <div className="relative">
      <div className="pointer-events-none">
        <HowItWorksMarketingPage page={page} intro={intro} stepsSection={steps} />
      </div>
      {[intro, steps].map((section, index) =>
        section ? (
          <button
            key={section.sectionKey}
            type="button"
            onClick={() => onSelectSection(index)}
            className={cn(
              "absolute left-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-xs font-black shadow-lg transition",
              index === 0 ? "top-3" : "top-[39rem]",
              selectedIndex === index ? "bg-primary text-white" : "bg-slate-950/85 text-white"
            )}
          >
            <span className="rounded bg-white/20 px-1.5 py-0.5">{index + 1}</span>
            <span className="truncate">{section.label || section.title || "Section"}</span>
          </button>
        ) : null
      )}
    </div>
  );
}

function PayoutsCmsLivePreview({
  page,
  selectedIndex,
  onSelectSection
}: {
  page: CmsPage;
  selectedIndex: number;
  onSelectSection: (index: number) => void;
}) {
  const intro = page.sections?.[0];
  const workflow = page.sections?.[1];

  return (
    <div className="relative">
      <div className="pointer-events-none">
        <PayoutsMarketingPage page={page} intro={intro} workflowSection={workflow} />
      </div>
      {[intro, workflow].map((section, index) =>
        section ? (
          <button
            key={section.sectionKey}
            type="button"
            onClick={() => onSelectSection(index)}
            className={cn(
              "absolute left-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-xs font-black shadow-lg transition",
              index === 0 ? "top-3" : "top-[39rem]",
              selectedIndex === index ? "bg-primary text-white" : "bg-slate-950/85 text-white"
            )}
          >
            <span className="rounded bg-white/20 px-1.5 py-0.5">{index + 1}</span>
            <span className="truncate">{section.label || section.title || "Section"}</span>
          </button>
        ) : null
      )}
    </div>
  );
}

function AffiliateCmsLivePreview({
  page,
  selectedIndex,
  onSelectSection
}: {
  page: CmsPage;
  selectedIndex: number;
  onSelectSection: (index: number) => void;
}) {
  const intro = page.sections?.[0];
  const linkSection = page.sections?.[1];

  return (
    <div className="relative">
      <div className="pointer-events-none">
        <AffiliateMarketingPage page={page} intro={intro} linkSection={linkSection} preview />
      </div>
      {[intro, linkSection].map((section, index) => (
        section ? (
          <button
            key={section.sectionKey}
            type="button"
            onClick={() => onSelectSection(index)}
            className={cn(
              "absolute left-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-xs font-black shadow-lg transition",
              index === 0 ? "top-3" : "top-[27rem]",
              selectedIndex === index ? "bg-primary text-white" : "bg-slate-950/85 text-white"
            )}
          >
            <span className="rounded bg-white/20 px-1.5 py-0.5">{index + 1}</span>
            <span className="truncate">{section.label || section.title || "Section"}</span>
          </button>
        ) : null
      ))}
    </div>
  );
}

function FaqCmsLivePreview({
  page,
  selectedIndex,
  onSelectSection
}: {
  page: CmsPage;
  selectedIndex: number;
  onSelectSection: (index: number) => void;
}) {
  const intro = page.sections?.[0];
  const questions = page.sections?.[1];
  const faqItems = parseFaqItems(page.metadata);
  const visibleCount = faqItems.filter((item) => item.visible !== false && item.question.trim()).length;

  return (
    <div className="bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white">
      {intro ? (
        <div className={cn("group relative border-2 transition", selectedIndex === 0 ? "border-primary" : "border-transparent hover:border-primary/40")}>
          <div className="pointer-events-none">
            <CmsSectionRenderer section={{ ...intro, published: true, isVisible: true }} />
          </div>
          <button
            type="button"
            onClick={() => onSelectSection(0)}
            className={cn("absolute left-3 top-3 z-20 rounded-md px-3 py-2 text-xs font-black shadow-lg", selectedIndex === 0 ? "bg-primary text-white" : "bg-slate-950/85 text-white")}
          >
            1 Intro
          </button>
        </div>
      ) : null}

      <div className={cn("group relative border-2 px-4 pb-16 transition sm:px-6 lg:px-8", selectedIndex === 1 ? "border-primary" : "border-transparent hover:border-primary/40")}>
        <button
          type="button"
          onClick={() => onSelectSection(1)}
          className={cn("absolute left-3 top-3 z-20 rounded-md px-3 py-2 text-xs font-black shadow-lg", selectedIndex === 1 ? "bg-primary text-white" : "bg-slate-950/85 text-white")}
        >
          2 Questions
        </button>
        <div className="mx-auto grid max-w-7xl gap-8 pt-14 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <div className="lg:self-start">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <span className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">FAQ</span>
              <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 dark:text-white">{questions?.title ?? "Frequently asked questions"}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{questions?.content ?? page.content}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-4 dark:bg-white/[0.05]">
                  <strong className="block text-2xl font-black text-slate-950 dark:text-white">{visibleCount}</strong>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Answers</span>
                </div>
                <div className="rounded-md bg-slate-50 p-4 dark:bg-white/[0.05]">
                  <strong className="block text-2xl font-black text-slate-950 dark:text-white">CMS</strong>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Editable</span>
                </div>
              </div>
            </div>
          </div>
          <FaqList items={faqItems} />
        </div>
      </div>
    </div>
  );
}

function FundingCmsLivePreview({
  page,
  selectedIndex,
  onSelectSection
}: {
  page: CmsPage;
  selectedIndex: number;
  onSelectSection: (index: number) => void;
}) {
  const intro = page.sections?.[0];
  const fundingContent = parseFundingPageContent(page.metadata);

  return (
    <div className="bg-[#061126] text-white">
      <section className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_22%_12%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(34,211,238,0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div
            className={cn("group relative grid gap-8 border-2 p-2 transition lg:grid-cols-[1fr_auto] lg:items-end", selectedIndex === 0 ? "border-primary" : "border-transparent hover:border-primary/40")}
          >
            <button
              type="button"
              onClick={() => onSelectSection(0)}
              className={cn("absolute left-3 top-3 z-20 rounded-md px-3 py-2 text-xs font-black shadow-lg", selectedIndex === 0 ? "bg-primary text-white" : "bg-slate-950/85 text-white")}
            >
              1 Intro
            </button>
            <div className="max-w-3xl pt-12">
              <span className="inline-flex rounded-md bg-primary/20 px-3 py-1 text-xs font-black text-blue-200">{intro?.eyebrow ?? "Funding Programs"}</span>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl">{intro?.title ?? page.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">{intro?.content ?? page.content}</p>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-4 shadow-sm backdrop-blur sm:grid-cols-3 lg:w-[31rem]">
              {fundingContent.heroStats.filter((item) => item.visible !== false).map((item) => {
                const Icon = fundingIconMap[item.icon] ?? Trophy;
                return (
                  <div key={item.id} className="rounded-md bg-white/[0.05] p-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <strong className="mt-3 block text-xl text-white">{item.value}</strong>
                    <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 rounded-lg border border-dashed border-blue-300/30 bg-white/[0.04] p-8 text-center">
            <h3 className="text-xl font-black text-white">Challenge cards are managed from Admin Challenges</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Account size, price, rules, leverage, phase count, and active status come from the challenges module.
            </p>
            <a href="/admin/challenges" className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-white">
              Open challenges <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:grid-cols-3">
            {fundingContent.featureItems.filter((item) => item.visible !== false).map((item) => {
              const Icon = fundingIconMap[item.icon] ?? ShieldCheck;
              return (
                <div key={item.id} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {fundingContent.ctas.filter((cta) => cta.visible !== false).map((cta) => {
              const Icon = cta.icon ? fundingIconMap[cta.icon] : null;
              return (
                <span
                  key={cta.id}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-black",
                    cta.style === "secondary" ? "bg-white/10 text-white ring-1 ring-white/10" : "bg-primary text-white"
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {cta.label || "Button"}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function legalPageFromLiveContent(page: CmsPage) {
  const config = legalPreviewConfig[page.slug];
  if (!config) return page;

  return {
    ...page,
    sections: config.fallback.map((section, index) => ({
      sectionKey: `legal-${index + 1}`,
      label: section.title,
      eyebrow: null,
      title: section.title,
      content: section.body?.join("\n\n") ?? "",
      sortOrder: index + 1,
      sectionType: "block" as SectionType,
      published: true,
      isVisible: true,
      metadata: section.bullets?.length ? { bullets: section.bullets } : undefined
    }))
  };
}

function cleanCmsPageForSave(page: CmsPage) {
  return {
    slug: page.slug,
    title: page.title,
    content: page.content ?? "",
    metaTitle: page.metaTitle ?? undefined,
    metaDescription: page.metaDescription ?? undefined,
    published: page.published ?? true,
    metadata: page.metadata ?? {},
    sections: (page.sections ?? [])
      .filter((section) => section.sectionKey !== "__page_settings")
      .map((section, index) => ({
        sectionKey: section.sectionKey || `section-${index + 1}`,
        label: section.label || section.title || `Section ${index + 1}`,
        eyebrow: section.eyebrow ?? undefined,
        title: section.title || section.label || `Section ${index + 1}`,
        content: section.content ?? "",
        ctaLabel: section.ctaLabel ?? undefined,
        ctaHref: section.ctaHref ?? undefined,
        sortOrder: index + 1,
        sectionType: section.sectionType ?? "block",
        imageUrl: section.imageUrl ?? undefined,
        iconName: section.iconName ?? undefined,
        colorScheme: section.colorScheme ?? undefined,
        position: section.position ?? 0,
        metadata: section.metadata ?? undefined,
        isVisible: section.isVisible ?? true,
        published: section.published ?? true
      }))
  };
}

export default function AdvancedCmsEditor() {
  const pushToast = useToast((state) => state.push);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [draft, setDraft] = useState<CmsPage | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeletePageConfirm, setShowDeletePageConfirm] = useState(false);
  const [deleteSectionIndex, setDeleteSectionIndex] = useState<number | null>(null);
  const [newPageForm, setNewPageForm] = useState({
    title: "",
    slug: "",
    navLabel: "",
    navPlacement: "footer" as "header" | "footer" | "both" | "hidden"
  });
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop-1920");
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeText, setBadgeText] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("");
  const [pageQuery, setPageQuery] = useState("");

  const token = getStoredAuthToken("admin");

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ pages: CmsPage[] }>("/admin/cms", { token });
      const remoteBySlug = new Map(data.pages.filter((page) => page.slug !== "site-settings").map((page) => [page.slug, page]));
      const fixedPages = editableSlugs
        .map((slug) => {
          const fallback = cmsPageDrafts.find((page) => page.slug === slug) ?? {
            slug,
            title: fixedPageNames[slug],
            content: fixedPageNames[slug],
            published: true,
            sections: []
          };
          const remotePage = remoteBySlug.get(slug);
          return mergeCmsPage(fallback, remotePage, { mergeDefaultSections: !remotePage || slug === "home" })!;
        })
        .map((page) => ({
          ...page,
          title: page.title || fixedPageNames[page.slug],
          metadata: {
            navLabel: fixedPageNames[page.slug],
            navPlacement: page.slug === "home" ? "header" : "footer",
            ...(page.metadata ?? {})
          }
        }));
      const hiddenCmsSlugs = new Set(["site-settings", "layout-rules"]);
      const customPages = data.pages.filter((page) => !hiddenCmsSlugs.has(page.slug) && !editableSlugs.includes(page.slug));
      const editablePages = [...fixedPages, ...customPages];
      setPages(editablePages);
      if (editablePages.length > 0) {
        setSelectedPage(editablePages[0]);
        setDraft(JSON.parse(JSON.stringify(editablePages[0])));
      }
    } catch (error) {
      pushToast({
        title: "Failed to load pages",
        message: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  function selectPage(index: number) {
    setSelectedPageIndex(index);
    const page = pages[index];
    setSelectedPage(page);
    setDraft(JSON.parse(JSON.stringify(page)));
    setSelectedSectionIndex(0);
  }

  function updateCurrentSection(patch: Partial<CmsSection>) {
    if (!draft || !draft.sections) return;

    const updated = [...draft.sections];
    updated[selectedSectionIndex] = { ...updated[selectedSectionIndex], ...patch };
    setDraft({ ...draft, sections: updated });
  }

  function updatePageMetadata(patch: Record<string, any>) {
    if (!draft) return;
    setDraft({ ...draft, metadata: { ...(draft.metadata ?? {}), ...patch } });
  }

  function fundingContent() {
    return parseFundingPageContent(draft?.metadata);
  }

  function faqContent() {
    return parseFaqItems(draft?.metadata);
  }

  function affiliateContent() {
    return parseAffiliatePageContent(draft?.metadata);
  }

  function payoutsContent() {
    return parsePayoutsPageContent(draft?.metadata);
  }

  function howContent() {
    return parseHowItWorksPageContent(draft?.metadata);
  }

  function updateHowMetric(index: number, patch: Partial<HowMetric>) {
    const content = howContent();
    updatePageMetadata({ metrics: content.metrics.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addHowMetric() {
    const content = howContent();
    updatePageMetadata({
      metrics: [...content.metrics, { ...defaultHowItWorksPageContent.metrics[0], id: `metric-${Date.now()}`, value: "New", label: "Metric", visible: true }]
    });
  }

  function removeHowMetric(index: number) {
    const content = howContent();
    updatePageMetadata({ metrics: content.metrics.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateHowStep(index: number, patch: Partial<HowStep>) {
    const content = howContent();
    updatePageMetadata({ steps: content.steps.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addHowStep() {
    const content = howContent();
    updatePageMetadata({
      steps: [...content.steps, { ...defaultHowItWorksPageContent.steps[0], id: `step-${Date.now()}`, title: "New step", content: "Describe this step.", helper: "Add a short note.", visible: true }]
    });
  }

  function removeHowStep(index: number) {
    const content = howContent();
    updatePageMetadata({ steps: content.steps.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateHowCta(index: number, patch: Partial<HowCta>) {
    const content = howContent();
    updatePageMetadata({ ctas: content.ctas.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addHowCta() {
    const content = howContent();
    updatePageMetadata({ ctas: [...content.ctas, { id: `cta-${Date.now()}`, label: "New button", href: "/", style: "secondary", visible: true }] });
  }

  function removeHowCta(index: number) {
    const content = howContent();
    updatePageMetadata({ ctas: content.ctas.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updatePayoutMetric(index: number, patch: Partial<PayoutMetric>) {
    const content = payoutsContent();
    updatePageMetadata({ metrics: content.metrics.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addPayoutMetric() {
    const content = payoutsContent();
    updatePageMetadata({
      metrics: [...content.metrics, { ...defaultPayoutsPageContent.metrics[0], id: `metric-${Date.now()}`, value: "New", label: "Metric", helper: "Describe this metric.", visible: true }]
    });
  }

  function removePayoutMetric(index: number) {
    const content = payoutsContent();
    updatePageMetadata({ metrics: content.metrics.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updatePayoutListItem(group: "workflow" | "methods" | "trustCards", index: number, patch: Partial<PayoutCard>) {
    const content = payoutsContent();
    updatePageMetadata({ [group]: content[group].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addPayoutListItem(group: "workflow" | "methods" | "trustCards") {
    const content = payoutsContent();
    const fallback = defaultPayoutsPageContent[group][0];
    updatePageMetadata({
      [group]: [...content[group], { ...fallback, id: `${group}-${Date.now()}`, title: "New item", content: "Describe this payout item.", visible: true }]
    });
  }

  function removePayoutListItem(group: "workflow" | "methods" | "trustCards", index: number) {
    const content = payoutsContent();
    updatePageMetadata({ [group]: content[group].filter((_, itemIndex) => itemIndex !== index) });
  }

  function updatePayoutCta(index: number, patch: Partial<PayoutCta>) {
    const content = payoutsContent();
    updatePageMetadata({ ctas: content.ctas.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addPayoutCta() {
    const content = payoutsContent();
    updatePageMetadata({ ctas: [...content.ctas, { id: `cta-${Date.now()}`, label: "New button", href: "/", style: "secondary", visible: true }] });
  }

  function removePayoutCta(index: number) {
    const content = payoutsContent();
    updatePageMetadata({ ctas: content.ctas.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateAffiliateMetric(index: number, patch: Partial<AffiliateMetric>) {
    const content = affiliateContent();
    updatePageMetadata({ metrics: content.metrics.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addAffiliateMetric() {
    const content = affiliateContent();
    updatePageMetadata({
      metrics: [
        ...content.metrics,
        { ...defaultAffiliatePageContent.metrics[0], id: `metric-${Date.now()}`, value: "New", label: "Metric", helper: "Describe this metric.", visible: true }
      ]
    });
  }

  function removeAffiliateMetric(index: number) {
    const content = affiliateContent();
    updatePageMetadata({ metrics: content.metrics.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateAffiliateStep(index: number, patch: Partial<AffiliateCard>) {
    const content = affiliateContent();
    updatePageMetadata({ steps: content.steps.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addAffiliateStep() {
    const content = affiliateContent();
    updatePageMetadata({
      steps: [
        ...content.steps,
        { ...defaultAffiliatePageContent.steps[0], id: `step-${Date.now()}`, title: "New step", content: "Describe this affiliate step.", visible: true }
      ]
    });
  }

  function removeAffiliateStep(index: number) {
    const content = affiliateContent();
    updatePageMetadata({ steps: content.steps.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateAffiliateBenefit(index: number, patch: Partial<AffiliateCard>) {
    const content = affiliateContent();
    updatePageMetadata({ benefits: content.benefits.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addAffiliateBenefit() {
    const content = affiliateContent();
    updatePageMetadata({
      benefits: [
        ...content.benefits,
        { ...defaultAffiliatePageContent.benefits[0], id: `benefit-${Date.now()}`, title: "New benefit", content: "Describe this affiliate benefit.", visible: true }
      ]
    });
  }

  function removeAffiliateBenefit(index: number) {
    const content = affiliateContent();
    updatePageMetadata({ benefits: content.benefits.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateAffiliateCta(index: number, patch: Partial<AffiliateCta>) {
    const content = affiliateContent();
    updatePageMetadata({ ctas: content.ctas.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addAffiliateCta() {
    const content = affiliateContent();
    updatePageMetadata({
      ctas: [...content.ctas, { id: `cta-${Date.now()}`, label: "New button", href: "/", style: "secondary", visible: true }]
    });
  }

  function removeAffiliateCta(index: number) {
    const content = affiliateContent();
    updatePageMetadata({ ctas: content.ctas.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateFaqItem(index: number, patch: Partial<CmsFaqItem>) {
    const items = faqContent();
    updatePageMetadata({ faqItems: items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addFaqItem() {
    const items = faqContent();
    updatePageMetadata({
      faqItems: [
        ...items,
        {
          id: `faq-${Date.now()}`,
          question: "New question",
          answer: "Add the answer here.",
          bullets: [],
          visible: true
        }
      ]
    });
  }

  function removeFaqItem(index: number) {
    const items = faqContent();
    updatePageMetadata({ faqItems: items.filter((_, itemIndex) => itemIndex !== index) });
  }

  function resetFaqItemsFromDefaults() {
    updatePageMetadata({ faqItems: defaultCmsFaqItems });
    pushToast({ title: "FAQ defaults restored", message: "Review the imported FAQ questions, then save the page.", tone: "success" });
  }

  function updateFundingHeroStat(index: number, patch: Partial<FundingHeroStat>) {
    const content = fundingContent();
    updatePageMetadata({ heroStats: content.heroStats.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addFundingHeroStat() {
    const content = fundingContent();
    updatePageMetadata({
      heroStats: [
        ...content.heroStats,
        { ...defaultFundingPageContent.heroStats[0], id: `stat-${Date.now()}`, value: "New", label: "Metric", visible: true }
      ]
    });
  }

  function removeFundingHeroStat(index: number) {
    const content = fundingContent();
    updatePageMetadata({ heroStats: content.heroStats.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateFundingFeatureItem(index: number, patch: Partial<FundingFeatureItem>) {
    const content = fundingContent();
    updatePageMetadata({ featureItems: content.featureItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addFundingFeatureItem() {
    const content = fundingContent();
    updatePageMetadata({
      featureItems: [
        ...content.featureItems,
        { ...defaultFundingPageContent.featureItems[0], id: `feature-${Date.now()}`, label: "New funding benefit", visible: true }
      ]
    });
  }

  function removeFundingFeatureItem(index: number) {
    const content = fundingContent();
    updatePageMetadata({ featureItems: content.featureItems.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateFundingCta(index: number, patch: Partial<FundingCta>) {
    const content = fundingContent();
    updatePageMetadata({ ctas: content.ctas.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function addFundingCta() {
    const content = fundingContent();
    updatePageMetadata({
      ctas: [
        ...content.ctas,
        { id: `cta-${Date.now()}`, icon: "Target", label: "New button", href: "/", style: "secondary", visible: true }
      ]
    });
  }

  function removeFundingCta(index: number) {
    const content = fundingContent();
    updatePageMetadata({ ctas: content.ctas.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateSectionMetadata(patch: Record<string, any>) {
    if (!currentSection) return;
    updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ...patch } as any });
  }

  function sectionCtas() {
    return (currentSection?.metadata?.ctas as Array<Record<string, any>> | undefined) ?? [];
  }

  function sectionCards() {
    return (currentSection?.metadata?.cards as Array<Record<string, any>> | undefined) ?? [];
  }

  function sectionLists() {
    return (currentSection?.metadata?.lists as Array<Record<string, any>> | undefined) ?? [];
  }

  function galleryImages() {
    return (currentSection?.metadata?.images as string[] | undefined) ?? [];
  }

  function addSectionCta() {
    const ctas = sectionCtas();
    if (ctas.length >= 3) {
      pushToast({ title: "CTA limit reached", message: "A section can have maximum 3 CTA buttons.", tone: "error" });
      return;
    }
    updateSectionMetadata({
      ctas: [...ctas, { id: `cta-${Date.now()}`, label: "Button", href: "/", style: "solid" }]
    });
  }

  function updateSectionCta(index: number, patch: Record<string, any>) {
    updateSectionMetadata({ ctas: sectionCtas().map((cta, i) => (i === index ? { ...cta, ...patch } : cta)) });
  }

  function removeSectionCta(index: number) {
    updateSectionMetadata({ ctas: sectionCtas().filter((_, i) => i !== index) });
  }

  function addBuilderCard() {
    const cards = sectionCards();
    if (cards.length >= 10) {
      pushToast({ title: "Card limit reached", message: "A section can have maximum 10 cards.", tone: "error" });
      return;
    }
    updateSectionMetadata({
      cards: [
        ...cards,
        {
          id: `card-${Date.now()}`,
          icon: "Star",
          title: "Card title",
          content: "Card content",
          ctas: [{ id: `card-cta-${Date.now()}`, label: "Learn more", href: "/", style: "outline" }]
        }
      ]
    });
  }

  function addSectionList() {
    updateSectionMetadata({
      lists: [...sectionLists(), { id: `list-${Date.now()}`, type: "bullet", title: "List title", items: ["First item", "Second item"] }]
    });
  }

  function updateSectionList(index: number, patch: Record<string, any>) {
    updateSectionMetadata({ lists: sectionLists().map((list, i) => (i === index ? { ...list, ...patch } : list)) });
  }

  function removeSectionList(index: number) {
    updateSectionMetadata({ lists: sectionLists().filter((_, i) => i !== index) });
  }

  function updateCardList(cardIndex: number, value: string) {
    updateBuilderCard(cardIndex, { listItems: value });
  }

  function updateBuilderCard(index: number, patch: Record<string, any>) {
    updateSectionMetadata({ cards: sectionCards().map((card, i) => (i === index ? { ...card, ...patch } : card)) });
  }

  function removeBuilderCard(index: number) {
    updateSectionMetadata({ cards: sectionCards().filter((_, i) => i !== index) });
  }

  function updateCardCta(cardIndex: number, ctaIndex: number, patch: Record<string, any>) {
    const cards = sectionCards();
    updateSectionMetadata({
      cards: cards.map((card, index) =>
        index === cardIndex ? { ...card, ctas: ((card.ctas as Array<Record<string, any>> | undefined) ?? []).map((cta, i) => (i === ctaIndex ? { ...cta, ...patch } : cta)) } : card
      )
    });
  }

  function addCardCta(cardIndex: number) {
    const cards = sectionCards();
    const card = cards[cardIndex];
    const ctas = (card?.ctas as Array<Record<string, any>> | undefined) ?? [];
    if (ctas.length >= 2) {
      pushToast({ title: "Card CTA limit reached", message: "A card can have maximum 2 CTA buttons.", tone: "error" });
      return;
    }
    updateBuilderCard(cardIndex, { ctas: [...ctas, { id: `card-cta-${Date.now()}`, label: "Button", href: "/", style: "outline" }] });
  }

  function removeCardCta(cardIndex: number, ctaIndex: number) {
    const cards = sectionCards();
    const card = cards[cardIndex];
    const ctas = (card?.ctas as Array<Record<string, any>> | undefined) ?? [];
    updateBuilderCard(cardIndex, { ctas: ctas.filter((_, i) => i !== ctaIndex) });
  }

  async function handleSectionImage(file?: File) {
    if (!file || !currentSection) return;
    if (file.size > maxCmsImageBytes) {
      pushToast({ title: "Image is too large", message: "CMS images must be 700KB or smaller.", tone: "error" });
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateCurrentSection({ imageUrl: dataUrl });
  }

  async function handleGalleryImage(file?: File) {
    if (!file || !currentSection) return;
    const images = galleryImages();
    if (images.length >= 5) {
      pushToast({ title: "Image limit reached", message: "A section can have maximum 5 images.", tone: "error" });
      return;
    }
    if (file.size > maxCmsImageBytes) {
      pushToast({ title: "Image is too large", message: "CMS images must be 700KB or smaller.", tone: "error" });
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateSectionMetadata({ images: [...images, dataUrl] });
  }

  function removeGalleryImage(index: number) {
    updateSectionMetadata({ images: galleryImages().filter((_, i) => i !== index) });
  }

  async function handleSectionVideo(file?: File) {
    if (!file || !currentSection) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 8_000_000) {
      pushToast({ title: "Video is too large", message: "Please upload a shorter compressed video for this section.", tone: "error" });
      return;
    }
    updateCurrentSection({
      metadata: {
        ...(currentSection.metadata ?? {}),
        videoUrl: dataUrl
      } as any
    });
  }

  function createNewPage() {
    const title = newPageForm.title.trim();
    const slug = newPageForm.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!title || !slug) {
      pushToast({ title: "Page needs title and slug", message: "Add a page name and URL slug.", tone: "error" });
      return;
    }
    if (pages.some((page) => page.slug === slug)) {
      pushToast({ title: "Page already exists", message: "Use a different slug for this page.", tone: "error" });
      return;
    }
    const page: CmsPage = {
      slug,
      title,
      content: title,
      metaTitle: title,
      metaDescription: "",
      published: true,
      metadata: {
        navLabel: newPageForm.navLabel.trim() || title,
        navPlacement: newPageForm.navPlacement
      },
      sections: [
        {
          sectionKey: "intro",
          label: "Intro",
          eyebrow: null,
          title,
          content: "Add page content here.",
          sortOrder: 1,
          sectionType: "block",
          published: true,
          isVisible: true
        }
      ]
    };
    const nextPages = [...pages, page];
    setPages(nextPages);
    setSelectedPageIndex(nextPages.length - 1);
    setSelectedPage(page);
    setDraft(JSON.parse(JSON.stringify(page)));
    setSelectedSectionIndex(0);
    setNewPageForm({ title: "", slug: "", navLabel: "", navPlacement: "footer" });
    setShowNewPage(false);
  }

  function addSection() {
    if (!draft) return;

    const newSection: CmsSection = {
      sectionKey: `section-${Date.now()}`,
      label: "New Section",
      title: "Section Title",
      content: "Section content goes here",
      sortOrder: (draft.sections?.length ?? 0) + 1,
      sectionType: "block",
      published: true
    };

    setDraft({
      ...draft,
      sections: [...(draft.sections ?? []), newSection]
    });
    setSelectedSectionIndex((draft.sections?.length ?? 0));
    setShowNewSection(false);
  }

  function deleteSection(index: number) {
    if (!draft || !draft.sections) return;

    const updated = draft.sections.filter((_, i) => i !== index);
    setDraft({ ...draft, sections: updated });
    setSelectedSectionIndex(Math.max(0, index - 1));
    setDeleteSectionIndex(null);
  }

  function moveSection(index: number, direction: "up" | "down") {
    if (!draft || !draft.sections) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= draft.sections.length) return;

    const updated = [...draft.sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    updated.forEach((section, i) => {
      section.sortOrder = i + 1;
    });

    setDraft({ ...draft, sections: updated });
    setSelectedSectionIndex(newIndex);
  }

  function applyTextFormatting(format: "bold" | "italic" | "strike" | "link" | "code") {
    const textarea = document.querySelector("textarea[data-format-target]") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || "text";

    let formatted = selectedText;
    switch (format) {
      case "bold":
        formatted = `**${selectedText}**`;
        break;
      case "italic":
        formatted = `*${selectedText}*`;
        break;
      case "strike":
        formatted = `~~${selectedText}~~`;
        break;
      case "link":
        formatted = `[${selectedText}](url)`;
        break;
      case "code":
        formatted = "`" + selectedText + "`";
        break;
    }

    const newContent = text.substring(0, start) + formatted + text.substring(end);
    updateCurrentSection({ content: newContent });
  }

  function addBadgeToTitle() {
    if (!currentSection || !badgeText) return;

    const badge = {
      text: badgeText,
      icon: badgeIcon || undefined,
      id: `badge-${Date.now()}`
    };

    const badges = currentSection.metadata?.badges || [];
    updateCurrentSection({
      metadata: {
        ...currentSection.metadata,
        badges: [...badges, badge]
      } as any
    });

    setBadgeText("");
    setBadgeIcon("");
    setShowBadgeModal(false);
  }

  function removeBadge(badgeId: string) {
    if (!currentSection) return;

    const badges = (currentSection.metadata?.badges || []).filter((b: any) => b.id !== badgeId);
    updateCurrentSection({
      metadata: {
        ...currentSection.metadata,
        badges
      } as any
    });
  }

  function syncLegalPageFromLiveContent() {
    if (!draft || !legalPreviewConfig[draft.slug]) return;
    const syncedPage = legalPageFromLiveContent(draft);
    setDraft(syncedPage);
    setSelectedSectionIndex(0);
    pushToast({
      title: "Live content synced",
      message: "Review the sections, then save to update the CMS database.",
      tone: "success"
    });
  }

  async function savePage() {
    if (!draft || !token) return;

    setSaving(true);
    try {
      const data = await apiFetch<{ page: CmsPage }>("/admin/cms", {
        method: "POST",
        token,
        body: JSON.stringify(cleanCmsPageForSave(draft))
      });

      setSelectedPage(data.page);
      setDraft(data.page);
      setPages((current) => current.map((page) => (page.slug === data.page.slug ? data.page : page)));
      pushToast({
        title: "Page saved",
        message: "CMS page has been updated successfully.",
        tone: "success"
      });
      setShowSaveConfirm(false);
    } catch (error) {
      pushToast({
        title: "Failed to save",
        message: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  const currentSection = draft?.sections?.[selectedSectionIndex];
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !selectedPage) return false;
    return JSON.stringify(draft) !== JSON.stringify(selectedPage);
  }, [draft, selectedPage]);
  const cmsStats = useMemo(() => {
    const totalSections = pages.reduce((total, page) => total + (page.sections?.length ?? 0), 0);
    const publishedPages = pages.filter((page) => page.published !== false).length;
    const pagesNeedingReview = pages.filter((page) => getPageHealth(page).issues.length > 0).length;
    const customPages = pages.filter((page) => !editableSlugs.includes(page.slug)).length;

    return { totalSections, publishedPages, pagesNeedingReview, customPages };
  }, [pages]);
  const filteredPages = useMemo(() => {
    const query = pageQuery.trim().toLowerCase();
    return pages
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => {
        if (!query) return true;
        return [page.slug, page.title, pageDisplayName(page), page.metadata?.navLabel].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      });
  }, [pageQuery, pages]);
  const currentPageHealth = draft ? getPageHealth(draft) : null;
  const selectedPageHref = pagePublicHref(draft);
  const currentSectionScore = getSectionScore(currentSection);

  if (loading) {
    return <CmsEditorSkeleton />;
  }

  async function deleteCurrentPage() {
    if (!draft || !token) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/cms/${encodeURIComponent(draft.slug)}`, {
        method: "DELETE",
        token
      });
      const remaining = pages.filter((page) => page.slug !== draft.slug);
      setPages(remaining);
      const nextIndex = Math.max(0, Math.min(selectedPageIndex, remaining.length - 1));
      const nextPage = remaining[nextIndex] ?? null;
      setSelectedPageIndex(nextIndex);
      setSelectedPage(nextPage);
      setDraft(nextPage ? JSON.parse(JSON.stringify(nextPage)) : null);
      setSelectedSectionIndex(0);
      setShowDeletePageConfirm(false);
      pushToast({ title: "Page deleted", message: "CMS page has been deleted from the database.", tone: "success" });
    } catch (error) {
      pushToast({ title: "Delete failed", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const currentPreset = previewPresets.find((preset) => preset.device === previewDevice) ?? previewPresets[0];
  const currentDimensions = { width: currentPreset.width, height: currentPreset.height };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950 lg:min-h-[calc(100dvh-8rem)]">
      {/* Page Selector */}
      <div className="border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02] sm:p-4">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "CMS pages", value: pages.length, helper: `${cmsStats.publishedPages} published`, Icon: FileText },
              { label: "Sections", value: cmsStats.totalSections, helper: "Editable content blocks", Icon: Layers },
              { label: "Need review", value: cmsStats.pagesNeedingReview, helper: "SEO or copy gaps", Icon: ShieldCheck },
              { label: "Custom pages", value: cmsStats.customPages, helper: "Client-created pages", Icon: Globe2 }
            ].map(({ label, value, helper, Icon }) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/20">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 xl:flex xl:items-center xl:justify-between">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={pageQuery}
                onChange={(event) => setPageQuery(event.target.value)}
                placeholder="Search CMS pages by title, slug, or nav label"
                className="pl-9"
              />
            </label>
            {/* Page Navigation */}
            <div className="flex flex-wrap gap-2 xl:ml-4 xl:flex-shrink-0">
              <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={() => setShowNewPage(true)}>
                <Plus className="h-4 w-4" />
                New page
              </Button>
              <a
                href={selectedPageHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
              <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => setShowDeletePageConfirm(true)} disabled={!draft || draft.slug === "home"}>
                <Trash2 className="h-4 w-4" />
                Delete page
              </Button>
              <button
                type="button"
                onClick={() => selectPage(Math.max(0, selectedPageIndex - 1))}
                disabled={selectedPageIndex === 0}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                <ChevronUp className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => selectPage(Math.min(pages.length - 1, selectedPageIndex + 1))}
                disabled={selectedPageIndex === pages.length - 1}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                <ChevronDown className="h-4 w-4" />
                Next
              </button>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
            {filteredPages.map(({ page, index }) => {
              const health = getPageHealth(page);

              return (
                <button
                  key={page.slug}
                  onClick={() => selectPage(index)}
                  className={cn(
                    "min-w-[13rem] rounded-md border px-3 py-2 text-left transition",
                    selectedPageIndex === index
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/40 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10"
                  )}
                >
                  <span className="block truncate text-sm font-black">{pageDisplayName(page)}</span>
                  <span className={cn("mt-1 inline-flex rounded px-2 py-0.5 text-[11px] font-black", selectedPageIndex === index ? "bg-white/20 text-white" : health.issues.length ? "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300")}>
                    {health.tone}
                  </span>
                </button>
              );
            })}
            {filteredPages.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                No CMS pages match this search.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden">
        {/* Section Sidebar */}
        <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Sections</h3>
            <Button
              variant="secondary"
              onClick={() => setShowNewSection(true)}
              className="h-9 rounded-md px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[calc(100dvh-18rem)] lg:space-y-2 lg:overflow-y-auto lg:pb-0">
            {draft?.sections?.map((section, index) => (
              <div
                key={section.sectionKey || index}
                onClick={() => setSelectedSectionIndex(index)}
                className={cn(
                  "min-w-[12rem] cursor-pointer rounded-md p-3 transition lg:min-w-0",
                  selectedSectionIndex === index
                    ? "bg-primary/10 border border-primary dark:bg-primary/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary dark:text-blue-400">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {section.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {section.sectionType || "block"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {section.published === false ? <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-700 dark:bg-white/10 dark:text-slate-300">Draft</span> : null}
                      {section.isVisible === false ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Hidden</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {currentSection ? (
            <>
              <div className="border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02] sm:p-4">
                <div className="grid gap-3 xl:flex xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-black text-slate-950 dark:text-white">{draft?.title}</h2>
                      <span
                        className={cn(
                          "inline-flex rounded px-2 py-1 text-xs font-black",
                          currentPageHealth?.issues.length
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                        )}
                      >
                        {currentPageHealth?.score ?? 0}% health
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded px-2 py-1 text-xs font-black",
                          currentSectionScore.score >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                        )}
                      >
                        Section {currentSectionScore.score}% · {currentSectionScore.label}
                      </span>
                      {hasUnsavedChanges ? (
                        <span className="inline-flex rounded bg-blue-100 px-2 py-1 text-xs font-black text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                          Unsaved changes
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "inline-flex rounded px-2 py-1 text-xs font-black",
                          draft?.published === false
                            ? "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                            : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300"
                        )}
                      >
                        Page {publishLabel(draft?.published)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded px-2 py-1 text-xs font-black",
                          currentSection?.published === false || currentSection?.isVisible === false
                            ? "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                            : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300"
                        )}
                      >
                        Section {currentSection?.isVisible === false ? "Hidden" : publishLabel(currentSection?.published)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>/{draft?.slug}</span>
                      <span>{draft?.sections?.length ?? 0} sections</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatUpdatedAt(draft?.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(currentPageHealth?.issues ?? []).slice(0, 3).map((issue) => (
                      <span key={issue} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                        {issue}
                      </span>
                    ))}
                    {currentSectionScore.issues.slice(0, 2).map((issue) => (
                      <span key={`section-${issue}`} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                        {issue}
                      </span>
                    ))}
                    {currentPageHealth?.issues.length === 0 ? (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                        Ready to publish
                      </span>
                    ) : null}
                    {draft && legalPreviewConfig[draft.slug] ? (
                      <Button type="button" variant="secondary" className="h-8 rounded-md px-2 text-xs" onClick={syncLegalPageFromLiveContent}>
                        <Copy className="h-3.5 w-3.5" />
                        Sync live content
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                {(["content", "seo", "styling", "preview"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "min-w-28 flex-1 px-4 py-3 text-sm font-semibold transition border-b-2 capitalize",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6">
                {activeTab === "content" && (
                  <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <Navigation className="h-4 w-4 text-primary" />
                        Page identity and navigation
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          CMS page name
                          <Input value={draft?.title ?? ""} onChange={(e) => draft && setDraft({ ...draft, title: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          URL slug
                          <Input value={draft?.slug ?? ""} disabled />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Header/Footer label
                          <Input
                            value={draft?.metadata?.navLabel ?? pageDisplayName(draft!)}
                            onChange={(e) => updatePageMetadata({ navLabel: e.target.value })}
                            placeholder="Navigation label"
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Show page link
                          <CustomSelect
                            value={draft?.metadata?.navPlacement ?? "footer"}
                            onChange={(value) => updatePageMetadata({ navPlacement: value })}
                            options={[
                              { value: "hidden", label: "Hidden from navigation" },
                              { value: "footer", label: "Footer only" },
                              { value: "header", label: "Header dropdown" },
                              { value: "both", label: "Header dropdown and footer" }
                            ]}
                          />
                        </label>
                        <div className="md:col-span-2">
                          <SwitchControl
                            checked={draft?.published !== false}
                            onChange={(checked) => draft && setDraft({ ...draft, published: checked })}
                            label={draft?.published === false ? "Page is draft" : "Page is published"}
                            description="Draft pages can be edited and saved before they appear on the public website."
                          />
                        </div>
                      </div>
                    </div>

                    {draft?.slug === "funding-programs" ? (
                      <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-blue-400/10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">Funding page live content</h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Edit the hero metric cards, bottom rule strip, and CTA buttons shown on /funding-programs.</p>
                          </div>
                          <a
                            href="/admin/challenges"
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-sm font-black text-primary transition hover:border-primary/40 dark:border-blue-400/20 dark:bg-white/[0.06]"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Edit challenge cards
                          </a>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Hero metric cards</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addFundingHeroStat}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {fundingContent().heroStats.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateFundingHeroStat(index, { icon: value as FundingIconName })} options={fundingIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Big text
                                  <Input value={item.value} onChange={(e) => updateFundingHeroStat(index, { value: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={item.label} onChange={(e) => updateFundingHeroStat(index, { label: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateFundingHeroStat(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeFundingHeroStat(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Bottom feature strip</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addFundingFeatureItem}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {fundingContent().featureItems.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateFundingFeatureItem(index, { icon: value as FundingIconName })} options={fundingIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Text
                                  <Input value={item.label} onChange={(e) => updateFundingFeatureItem(index, { label: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateFundingFeatureItem(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeFundingFeatureItem(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Page CTA buttons</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addFundingCta}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {fundingContent().ctas.map((cta, index) => (
                              <div key={cta.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_10rem_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={cta.icon ?? "Target"} onChange={(value) => updateFundingCta(index, { icon: value as FundingIconName })} options={fundingIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={cta.label} onChange={(e) => updateFundingCta(index, { label: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  URL
                                  <Input value={cta.href} onChange={(e) => updateFundingCta(index, { href: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Style
                                  <CustomSelect
                                    value={cta.style}
                                    onChange={(value) => updateFundingCta(index, { style: value as FundingCta["style"] })}
                                    options={[
                                      { value: "primary", label: "Primary" },
                                      { value: "secondary", label: "Secondary" }
                                    ]}
                                  />
                                </label>
                                <SwitchControl checked={cta.visible !== false} onChange={(checked) => updateFundingCta(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeFundingCta(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {draft?.slug === "affiliate" ? (
                      <div className="space-y-5 rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 dark:border-blue-400/20 dark:from-blue-400/10 dark:to-white/[0.03]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">Affiliate page content</h3>
                              <span className="rounded bg-white px-2 py-1 text-xs font-black text-primary shadow-sm dark:bg-white/10">
                                {affiliateContent().metrics.filter((item) => item.visible !== false).length} stats
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Edit the affiliate hero metrics, workflow steps, benefit cards, and CTA buttons shown on /affiliate.</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Hero metric cards</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addAffiliateMetric}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {affiliateContent().metrics.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.4fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateAffiliateMetric(index, { icon: value as AffiliateIconName })} options={affiliateIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Value
                                  <Input value={item.value} onChange={(e) => updateAffiliateMetric(index, { value: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={item.label} onChange={(e) => updateAffiliateMetric(index, { label: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Helper
                                  <Input value={item.helper} onChange={(e) => updateAffiliateMetric(index, { helper: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateAffiliateMetric(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeAffiliateMetric(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Workflow steps</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addAffiliateStep}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {affiliateContent().steps.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.5fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateAffiliateStep(index, { icon: value as AffiliateIconName })} options={affiliateIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Title
                                  <Input value={item.title} onChange={(e) => updateAffiliateStep(index, { title: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Text
                                  <Input value={item.content} onChange={(e) => updateAffiliateStep(index, { content: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateAffiliateStep(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeAffiliateStep(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Benefit cards</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addAffiliateBenefit}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {affiliateContent().benefits.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.5fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateAffiliateBenefit(index, { icon: value as AffiliateIconName })} options={affiliateIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Title
                                  <Input value={item.title} onChange={(e) => updateAffiliateBenefit(index, { title: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Text
                                  <Input value={item.content} onChange={(e) => updateAffiliateBenefit(index, { content: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateAffiliateBenefit(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeAffiliateBenefit(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">CTA buttons</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addAffiliateCta}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {affiliateContent().ctas.map((cta, index) => (
                              <div key={cta.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={cta.label} onChange={(e) => updateAffiliateCta(index, { label: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  URL
                                  <Input value={cta.href} onChange={(e) => updateAffiliateCta(index, { href: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Style
                                  <CustomSelect
                                    value={cta.style}
                                    onChange={(value) => updateAffiliateCta(index, { style: value as AffiliateCta["style"] })}
                                    options={[
                                      { value: "primary", label: "Primary" },
                                      { value: "secondary", label: "Secondary" }
                                    ]}
                                  />
                                </label>
                                <SwitchControl checked={cta.visible !== false} onChange={(checked) => updateAffiliateCta(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeAffiliateCta(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {draft?.slug === "payouts" ? (
                      <div className="space-y-5 rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 dark:border-blue-400/20 dark:from-blue-400/10 dark:to-white/[0.03]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">Payouts page content</h3>
                              <span className="rounded bg-white px-2 py-1 text-xs font-black text-primary shadow-sm dark:bg-white/10">
                                {payoutsContent().workflow.filter((item) => item.visible !== false).length} steps
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Edit the payout hero metrics, workflow, payout methods, trust cards, and CTA buttons shown on /payouts.</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Hero metric cards</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addPayoutMetric}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {payoutsContent().metrics.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.4fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updatePayoutMetric(index, { icon: value as PayoutIconName })} options={payoutIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Value
                                  <Input value={item.value} onChange={(e) => updatePayoutMetric(index, { value: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={item.label} onChange={(e) => updatePayoutMetric(index, { label: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Helper
                                  <Input value={item.helper} onChange={(e) => updatePayoutMetric(index, { helper: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updatePayoutMetric(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removePayoutMetric(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {([
                          { key: "workflow", title: "Workflow steps", add: () => addPayoutListItem("workflow"), update: updatePayoutListItem, remove: removePayoutListItem },
                          { key: "methods", title: "Payout methods", add: () => addPayoutListItem("methods"), update: updatePayoutListItem, remove: removePayoutListItem },
                          { key: "trustCards", title: "Trust cards", add: () => addPayoutListItem("trustCards"), update: updatePayoutListItem, remove: removePayoutListItem }
                        ] as const).map((group) => (
                          <div key={group.key} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">{group.title}</h4>
                              <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={group.add}>
                                <Plus className="h-4 w-4" />
                                Add
                              </Button>
                            </div>
                            <div className="grid gap-3">
                              {payoutsContent()[group.key].map((item, index) => (
                                <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.5fr)_9rem_auto] md:items-end">
                                  <label className="grid gap-2 text-sm font-semibold">
                                    Icon
                                    <CustomSelect value={item.icon} onChange={(value) => group.update(group.key, index, { icon: value as PayoutIconName })} options={payoutIconOptions} />
                                  </label>
                                  <label className="grid gap-2 text-sm font-semibold">
                                    Title
                                    <Input value={item.title} onChange={(e) => group.update(group.key, index, { title: e.target.value })} />
                                  </label>
                                  <label className="grid gap-2 text-sm font-semibold">
                                    Text
                                    <Input value={item.content} onChange={(e) => group.update(group.key, index, { content: e.target.value })} />
                                  </label>
                                  <SwitchControl checked={item.visible !== false} onChange={(checked) => group.update(group.key, index, { visible: checked })} label="Show" />
                                  <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => group.remove(group.key, index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">CTA buttons</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addPayoutCta}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {payoutsContent().ctas.map((cta, index) => (
                              <div key={cta.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={cta.label} onChange={(e) => updatePayoutCta(index, { label: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  URL
                                  <Input value={cta.href} onChange={(e) => updatePayoutCta(index, { href: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Style
                                  <CustomSelect
                                    value={cta.style}
                                    onChange={(value) => updatePayoutCta(index, { style: value as PayoutCta["style"] })}
                                    options={[
                                      { value: "primary", label: "Primary" },
                                      { value: "secondary", label: "Secondary" }
                                    ]}
                                  />
                                </label>
                                <SwitchControl checked={cta.visible !== false} onChange={(checked) => updatePayoutCta(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removePayoutCta(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {draft?.slug === "how-it-works" ? (
                      <div className="space-y-5 rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 dark:border-blue-400/20 dark:from-blue-400/10 dark:to-white/[0.03]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">How It Works page content</h3>
                              <span className="rounded bg-white px-2 py-1 text-xs font-black text-primary shadow-sm dark:bg-white/10">
                                {howContent().steps.filter((item) => item.visible !== false).length} steps
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Edit the hero metrics, workflow steps, helper notes, and CTA buttons shown on /how-it-works.</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Hero metric cards</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addHowMetric}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {howContent().metrics.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateHowMetric(index, { icon: value as HowIconName })} options={howIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Value
                                  <Input value={item.value} onChange={(e) => updateHowMetric(index, { value: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={item.label} onChange={(e) => updateHowMetric(index, { label: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateHowMetric(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeHowMetric(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">Workflow steps</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addHowStep}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {howContent().steps.map((item, index) => (
                              <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <CustomSelect value={item.icon} onChange={(value) => updateHowStep(index, { icon: value as HowIconName })} options={howIconOptions} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Title
                                  <Input value={item.title} onChange={(e) => updateHowStep(index, { title: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Text
                                  <Input value={item.content} onChange={(e) => updateHowStep(index, { content: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Helper
                                  <Input value={item.helper} onChange={(e) => updateHowStep(index, { helper: e.target.value })} />
                                </label>
                                <SwitchControl checked={item.visible !== false} onChange={(checked) => updateHowStep(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeHowStep(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">CTA buttons</h4>
                            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={addHowCta}>
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {howContent().ctas.map((cta, index) => (
                              <div key={cta.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_9rem_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Label
                                  <Input value={cta.label} onChange={(e) => updateHowCta(index, { label: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  URL
                                  <Input value={cta.href} onChange={(e) => updateHowCta(index, { href: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Style
                                  <CustomSelect
                                    value={cta.style}
                                    onChange={(value) => updateHowCta(index, { style: value as HowCta["style"] })}
                                    options={[
                                      { value: "primary", label: "Primary" },
                                      { value: "secondary", label: "Secondary" }
                                    ]}
                                  />
                                </label>
                                <SwitchControl checked={cta.visible !== false} onChange={(checked) => updateHowCta(index, { visible: checked })} label="Show" />
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeHowCta(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {draft?.slug === "faq" ? (
                      <div className="space-y-5 rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 dark:border-blue-400/20 dark:from-blue-400/10 dark:to-white/[0.03]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">FAQ questions</h3>
                              <span className="rounded bg-white px-2 py-1 text-xs font-black text-primary shadow-sm dark:bg-white/10">
                                {faqContent().filter((item) => item.visible !== false).length} visible
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Edit the live FAQ accordion. Add new questions, hide old ones, and manage bullet points from here.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={resetFaqItemsFromDefaults}>
                              <Copy className="h-4 w-4" />
                              Restore imported FAQ
                            </Button>
                            <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={addFaqItem}>
                              <Plus className="h-4 w-4" />
                              Add question
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          {faqContent().map((item, index) => (
                            <div key={item.id} className={cn("overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-950/40", item.visible === false ? "border-slate-200 opacity-70 dark:border-white/10" : "border-slate-200 dark:border-white/10")}>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-xs font-black text-white">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.question || "Untitled question"}</p>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.bullets.length} bullet{item.bullets.length === 1 ? "" : "s"}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <div className="w-28">
                                    <SwitchControl checked={item.visible !== false} onChange={(checked) => updateFaqItem(index, { visible: checked })} label="Show" />
                                  </div>
                                  <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeFaqItem(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid gap-4 p-4">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Question
                                  <Input value={item.question} onChange={(e) => updateFaqItem(index, { question: e.target.value })} className="font-semibold" />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Answer paragraphs
                                  <textarea
                                    value={item.answer}
                                    onChange={(e) => updateFaqItem(index, { answer: e.target.value })}
                                    placeholder="Use blank lines between paragraphs."
                                    className="h-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                  />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Bullet points
                                  <textarea
                                    value={item.bullets.join("\n")}
                                    onChange={(e) => updateFaqItem(index, { bullets: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}
                                    placeholder="One bullet per line"
                                    className="h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                          {faqContent().length === 0 ? (
                            <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                              No FAQ questions yet. Add one to show it on the live FAQ page.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Section Label
                      </label>
                      <Input
                        value={currentSection.label}
                        onChange={(e) => updateCurrentSection({ label: e.target.value })}
                        placeholder="e.g., Hero Section"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Section Type
                      </label>
                      <CustomSelect
                        value={currentSection.sectionType || "block"}
                        onChange={(value) => updateCurrentSection({ sectionType: value as SectionType })}
                        options={[
                          { value: "block", label: "Block" },
                          { value: "grid", label: "Grid" },
                          { value: "flex", label: "Flex" },
                          { value: "carousel", label: "Carousel" },
                          { value: "media", label: "Media" },
                          { value: "split", label: "Split" }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Eyebrow
                      </label>
                      <Input
                        value={currentSection.eyebrow || ""}
                        onChange={(e) => updateCurrentSection({ eyebrow: e.target.value || undefined })}
                        placeholder="Optional subtitle"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Title
                      </label>
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={currentSection.title}
                          onChange={(e) => updateCurrentSection({ title: e.target.value })}
                          placeholder="Section title"
                          className="min-w-0 flex-1"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => setShowBadgeModal(true)}
                          className="h-10 shrink-0 px-3"
                          aria-label="Add badge"
                        >
                          <BadgeIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Badge</span>
                        </Button>
                      </div>
                      {currentSection.metadata?.badges && (currentSection.metadata.badges as any[]).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {(currentSection.metadata.badges as any[]).map((badge) => (
                            <div
                              key={badge.id}
                              className="inline-flex items-center gap-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 px-2 py-1 rounded text-xs"
                            >
                              {badge.icon && <span>{badge.icon}</span>}
                              <span>{badge.text}</span>
                              <button onClick={() => removeBadge(badge.id)} className="ml-1 hover:opacity-70">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Content
                      </label>
                      <div className="mb-2 flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-white/10">
                        <button
                          onClick={() => applyTextFormatting("bold")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("italic")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("strike")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Strikethrough"
                        >
                          <Strikethrough className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("link")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Link"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("code")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Code"
                        >
                          <Code className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        data-format-target
                        value={currentSection.content}
                        onChange={(e) => updateCurrentSection({ content: e.target.value })}
                        placeholder="Section content (supports **bold**, *italic*, [links](url), `code`)"
                        className="w-full h-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Use **text** for bold, *text* for italic, [text](url) for links, `code` for code
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          CTA Label
                        </label>
                        <Input
                          value={currentSection.ctaLabel || ""}
                          onChange={(e) => updateCurrentSection({ ctaLabel: e.target.value || undefined })}
                          placeholder="e.g., Get Started"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          CTA Link
                        </label>
                        <Input
                          value={currentSection.ctaHref || ""}
                          onChange={(e) => updateCurrentSection({ ctaHref: e.target.value || undefined })}
                          placeholder="/dashboard"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">Section media</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          Image upload
                          <span className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]">
                            {currentSection.imageUrl ? <img src={currentSection.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Upload image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => {
                                void handleSectionImage(event.target.files?.[0]);
                                event.currentTarget.value = "";
                              }}
                            />
                          </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Video upload
                          <span className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]">
                            <FileVideo className="h-5 w-5 text-slate-400" />
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {currentSection.metadata?.videoUrl ? "Replace video" : "Upload one video"}
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              className="sr-only"
                              onChange={(event) => {
                                void handleSectionVideo(event.target.files?.[0]);
                                event.currentTarget.value = "";
                              }}
                            />
                          </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Image position
                          <CustomSelect
                            value={String(currentSection.position ?? 0)}
                            onChange={(value) => updateCurrentSection({ position: Number(value) })}
                            options={[
                              { value: "0", label: "Top" },
                              { value: "1", label: "Left" },
                              { value: "2", label: "Right" },
                              { value: "3", label: "Bottom" },
                              { value: "4", label: "Background" }
                            ]}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Icon name
                          <Input value={currentSection.iconName ?? ""} onChange={(e) => updateCurrentSection({ iconName: e.target.value || undefined })} placeholder="e.g. ShieldCheck" />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">Image gallery</h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional. Add up to 5 images per section.</p>
                        </div>
                        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                          <Upload className="h-4 w-4" />
                          Add image
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => {
                              void handleGalleryImage(event.target.files?.[0]);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {galleryImages().map((image, index) => (
                          <div key={`${image.slice(0, 24)}-${index}`} className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                            <img src={image} alt="" className="aspect-video w-full object-cover" />
                            <button type="button" onClick={() => removeGalleryImage(index)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-slate-950/70 text-white">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {galleryImages().length === 0 ? (
                          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:col-span-2 lg:col-span-5">
                            No gallery images added. This is optional.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">Section CTA buttons</h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional. Add up to 3 section buttons with individual styles.</p>
                        </div>
                        <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={addSectionCta}>
                          <Plus className="h-4 w-4" />
                          Add CTA
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {sectionCtas().map((cta, index) => (
                          <div key={cta.id ?? index} className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] md:items-end">
                            <label className="grid gap-2 text-sm font-semibold">
                              Label
                              <Input value={cta.label ?? ""} onChange={(e) => updateSectionCta(index, { label: e.target.value })} />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold">
                              Link
                              <Input value={cta.href ?? ""} onChange={(e) => updateSectionCta(index, { href: e.target.value })} />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold">
                              Type
                              <CustomSelect
                                value={cta.style ?? "solid"}
                                onChange={(value) => updateSectionCta(index, { style: value })}
                                options={[
                                  { value: "solid", label: "BG button" },
                                  { value: "outline", label: "Border transparent" },
                                  { value: "soft", label: "Soft BG" },
                                  { value: "ghost", label: "Transparent" }
                                ]}
                              />
                            </label>
                            <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeSectionCta(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {sectionCtas().length === 0 ? <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No extra CTA buttons. The legacy single CTA above will still work.</p> : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">Section lists</h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional. Add bullet, numbered, or check lists to this section.</p>
                        </div>
                        <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={addSectionList}>
                          <Plus className="h-4 w-4" />
                          Add list
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {sectionLists().map((list, index) => (
                          <div key={list.id ?? index} className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
                            <label className="grid gap-2 text-sm font-semibold">
                              List title
                              <Input value={list.title ?? ""} onChange={(e) => updateSectionList(index, { title: e.target.value })} />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold">
                              List type
                              <CustomSelect
                                value={list.type ?? "bullet"}
                                onChange={(value) => updateSectionList(index, { type: value })}
                                options={[
                                  { value: "bullet", label: "Bullet list" },
                                  { value: "number", label: "Numbered list" },
                                  { value: "check", label: "Check list" }
                                ]}
                              />
                            </label>
                            <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeSectionList(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <label className="grid gap-2 text-sm font-semibold md:col-span-3">
                              Items
                              <textarea
                                value={Array.isArray(list.items) ? list.items.join("\n") : ""}
                                onChange={(e) => updateSectionList(index, { items: e.target.value.split("\n").filter((item) => item.trim()) })}
                                placeholder="One item per line"
                                className="h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                              />
                            </label>
                          </div>
                        ))}
                        {sectionLists().length === 0 ? <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No lists added. This is optional.</p> : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">Cards builder</h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional. Build 1 to 10 cards, each with an icon and up to 2 buttons.</p>
                        </div>
                        <Button type="button" variant="secondary" className="h-10 rounded-md px-3" onClick={addBuilderCard}>
                          <Plus className="h-4 w-4" />
                          Add card
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        {sectionCards().map((card, cardIndex) => {
                          const cardCtas = (card.ctas as Array<Record<string, any>> | undefined) ?? [];
                          return (
                            <div key={card.id ?? cardIndex} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                              <div className="grid gap-3 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                                <label className="grid gap-2 text-sm font-semibold">
                                  Icon
                                  <Input value={card.icon ?? ""} onChange={(e) => updateBuilderCard(cardIndex, { icon: e.target.value })} placeholder="Star" />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Card title
                                  <Input value={card.title ?? ""} onChange={(e) => updateBuilderCard(cardIndex, { title: e.target.value })} />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold">
                                  Card text
                                  <Input value={card.content ?? ""} onChange={(e) => updateBuilderCard(cardIndex, { content: e.target.value })} />
                                </label>
                                <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeBuilderCard(cardIndex)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <label className="mt-3 grid gap-2 text-sm font-semibold">
                                Card list items
                                <textarea
                                  value={card.listItems ?? ""}
                                  onChange={(e) => updateCardList(cardIndex, e.target.value)}
                                  placeholder="One item per line"
                                  className="h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                />
                              </label>
                              <div className="mt-3 grid gap-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Card buttons</span>
                                  <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={() => addCardCta(cardIndex)}>
                                    <Plus className="h-4 w-4" />
                                    Add
                                  </Button>
                                </div>
                                {cardCtas.map((cta, ctaIndex) => (
                                  <div key={cta.id ?? ctaIndex} className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] md:items-end">
                                    <Input value={cta.label ?? ""} onChange={(e) => updateCardCta(cardIndex, ctaIndex, { label: e.target.value })} placeholder="Button label" />
                                    <Input value={cta.href ?? ""} onChange={(e) => updateCardCta(cardIndex, ctaIndex, { href: e.target.value })} placeholder="/link" />
                                    <CustomSelect
                                      value={cta.style ?? "outline"}
                                      onChange={(value) => updateCardCta(cardIndex, ctaIndex, { style: value })}
                                      options={[
                                        { value: "solid", label: "BG button" },
                                        { value: "outline", label: "Border transparent" },
                                        { value: "soft", label: "Soft BG" },
                                        { value: "ghost", label: "Transparent" }
                                      ]}
                                    />
                                    <Button type="button" variant="danger" className="h-10 rounded-md px-3" onClick={() => removeCardCta(cardIndex, ctaIndex)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {sectionCards().length === 0 ? <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No cards added yet. This section can stay as plain content.</p> : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">CTA button controls</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2 text-sm font-semibold">
                          CTA style
                          <CustomSelect
                            value={currentSection.metadata?.ctaStyle ?? "solid"}
                            onChange={(value) => updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ctaStyle: value } as any })}
                            options={[
                              { value: "solid", label: "Background button" },
                              { value: "outline", label: "Border button" },
                              { value: "solid-icon", label: "Background with icon" },
                              { value: "outline-icon", label: "Border with icon" }
                            ]}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          CTA icon
                          <Input value={currentSection.metadata?.ctaIcon ?? ""} onChange={(e) => updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ctaIcon: e.target.value } as any })} placeholder="ArrowRight" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Link target
                          <CustomSelect
                            value={currentSection.metadata?.ctaTarget ?? "_self"}
                            onChange={(value) => updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ctaTarget: value } as any })}
                            options={[
                              { value: "_self", label: "Same tab" },
                              { value: "_blank", label: "New tab" },
                              { value: "new-window", label: "New window" }
                            ]}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Page SEO metadata controls search title, keywords, and social preview data for the selected CMS page.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Page SEO Title
                      </label>
                      <Input
                        value={draft?.metaTitle || ""}
                        onChange={(e) => draft && setDraft({ ...draft, metaTitle: e.target.value })}
                        placeholder="Page title for search engines"
                        maxLength={60}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 60 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Page SEO Description
                      </label>
                      <textarea
                        value={draft?.metaDescription || ""}
                        onChange={(e) => draft && setDraft({ ...draft, metaDescription: e.target.value })}
                        placeholder="Page description for search engines"
                        maxLength={160}
                        className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 160 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Short keywords
                      </label>
                      <Input
                        value={draft?.metadata?.shortKeywords || ""}
                        onChange={(e) => updatePageMetadata({ shortKeywords: e.target.value })}
                        placeholder="Up to 8 short keywords, comma separated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Long keywords
                      </label>
                      <textarea
                        value={draft?.metadata?.longKeywords || ""}
                        onChange={(e) => updatePageMetadata({ longKeywords: e.target.value })}
                        placeholder="Up to 4 long-tail SEO keyword phrases"
                        className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Open Graph</h3>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Image URL
                        </label>
                        <Input
                          value={draft?.metadata?.ogImage || ""}
                          onChange={(e) => updatePageMetadata({ ogImage: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Title
                        </label>
                        <Input
                          value={draft?.metadata?.ogTitle || ""}
                          onChange={(e) => updatePageMetadata({ ogTitle: e.target.value })}
                          placeholder="Title for social sharing"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Description
                        </label>
                        <textarea
                          value={draft?.metadata?.ogDescription || ""}
                          onChange={(e) => updatePageMetadata({ ogDescription: e.target.value })}
                          placeholder="Description for social sharing"
                          className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "styling" && (
                  <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Theme Mode
                      </label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { value: "both", label: "Light & Dark" },
                          { value: "light", label: "Light only" },
                          { value: "dark", label: "Dark only" }
                        ].map((mode) => {
                          const active = (currentSection.metadata?.themeMode as string) === mode.value || (mode.value === "both" && !currentSection.metadata?.themeMode);
                          return (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => updateCurrentSection({ metadata: { ...currentSection.metadata, themeMode: mode.value } as any })}
                              className={cn(
                                "inline-flex h-11 items-center justify-center rounded-md border px-3 text-sm font-black transition",
                                active
                                  ? "border-primary bg-primary text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                              )}
                            >
                              {mode.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Choose which theme mode(s) this section should be visible in
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Color Scheme
                      </label>
                      <CustomSelect
                        value={currentSection.colorScheme || ""}
                        onChange={(value) => updateCurrentSection({ colorScheme: value || undefined })}
                        options={[
                          { value: "", label: "Auto (Light/Dark)" },
                          { value: "light", label: "Light" },
                          { value: "dark", label: "Dark" },
                          { value: "primary", label: "Primary" },
                          { value: "accent", label: "Accent" }
                        ]}
                      />
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">Section style controls</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2 text-sm font-semibold">
                          Background mode
                          <CustomSelect
                            value={currentSection.metadata?.backgroundMode ?? "auto"}
                            onChange={(value) => updateSectionMetadata({ backgroundMode: value })}
                            options={[
                              { value: "auto", label: "Auto" },
                              { value: "transparent", label: "Transparent" },
                              { value: "light", label: "Light" },
                              { value: "dark", label: "Dark" }
                            ]}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Title size
                          <Input value={currentSection.metadata?.titleFontSize ?? ""} onChange={(e) => updateSectionMetadata({ titleFontSize: e.target.value })} placeholder="36px or 2.25rem" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Subtitle size
                          <Input value={currentSection.metadata?.subtitleFontSize ?? ""} onChange={(e) => updateSectionMetadata({ subtitleFontSize: e.target.value })} placeholder="14px" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Paragraph size
                          <Input value={currentSection.metadata?.paragraphFontSize ?? ""} onChange={(e) => updateSectionMetadata({ paragraphFontSize: e.target.value })} placeholder="16px" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Bold text size
                          <Input value={currentSection.metadata?.boldFontSize ?? ""} onChange={(e) => updateSectionMetadata({ boldFontSize: e.target.value })} placeholder="inherit or 18px" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Title color
                          <Input type="color" value={currentSection.metadata?.titleColor ?? "#0f172a"} onChange={(e) => updateSectionMetadata({ titleColor: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Subtitle color
                          <Input type="color" value={currentSection.metadata?.subtitleColor ?? "#2563eb"} onChange={(e) => updateSectionMetadata({ subtitleColor: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Paragraph color
                          <Input type="color" value={currentSection.metadata?.paragraphColor ?? "#475569"} onChange={(e) => updateSectionMetadata({ paragraphColor: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Card background
                          <Input type="color" value={currentSection.metadata?.cardBackgroundColor ?? "#ffffff"} onChange={(e) => updateSectionMetadata({ cardBackgroundColor: e.target.value })} />
                        </label>
                      </div>
                    </div>

                    <div>
                      <SwitchControl
                        checked={currentSection.published !== false}
                        onChange={(checked) => updateCurrentSection({ published: checked })}
                        label={currentSection.published === false ? "Section is draft" : "Section is published"}
                        description="Save section drafts before showing them on the public page."
                      />
                    </div>

                    <div>
                      <SwitchControl
                        checked={currentSection.isVisible !== false}
                        onChange={(checked) => updateCurrentSection({ isVisible: checked })}
                        label="Visible on page"
                        description="Turn this off to hide the section without deleting it."
                      />
                    </div>
                  </div>
                )}

                {activeTab === "preview" && (
                  <div className="mx-auto w-full max-w-6xl overflow-hidden">
                    <div className="mb-6 grid gap-3">
                      {(["Desktop", "Tablet", "Mobile"] as const).map((group) => (
                        <div key={group} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                          <div className="mb-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400">{group} views</div>
                          <div className="flex flex-wrap gap-2">
                            {previewPresets.filter((preset) => preset.group === group).map(({ device, icon: Icon, label }) => (
                              <button
                                key={device}
                                onClick={() => setPreviewDevice(device)}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                                  previewDevice === device
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="w-full overflow-x-auto pb-2">
                      <div
                        style={{
                          width: "min(100%, " + currentDimensions.width + "px)",
                          minHeight: Math.min(currentDimensions.height, 1080)
                        }}
                        className="mx-auto overflow-hidden rounded-lg border-4 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                      >
                        {draft ? (
                          <LiveCmsPagePreview page={draft} selectedIndex={selectedSectionIndex} onSelectSection={setSelectedSectionIndex} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Controls */}
              <div className="sticky bottom-0 z-30 flex flex-col gap-3 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-9 rounded-md px-3"
                    onClick={() => moveSection(selectedSectionIndex, "up")}
                    disabled={selectedSectionIndex === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                    Up
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 rounded-md px-3"
                    onClick={() => moveSection(selectedSectionIndex, "down")}
                    disabled={selectedSectionIndex === (draft?.sections?.length ?? 0) - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                    Down
                  </Button>
                  <Button
                    variant="danger"
                    className="h-9 rounded-md px-3"
                    onClick={() => setDeleteSectionIndex(selectedSectionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {hasUnsavedChanges ? "Review and save before opening the public page." : "All local edits are saved for this page."}
                  </p>
                  <Button onClick={() => setShowSaveConfirm(true)} disabled={saving || !draft} className="w-full justify-center sm:w-auto">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {hasUnsavedChanges ? "Save Changes" : "Saved"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No sections available
            </div>
          )}
        </div>
      </div>

      {/* New Section Modal */}
      <Modal open={showNewSection} title="Add New Section" onClose={() => setShowNewSection(false)}>
        <div className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            A new blank section will be added at the end of this page. You can customize it immediately.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowNewSection(false)}>
              Cancel
            </Button>
            <Button onClick={addSection}>
              Add Section
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showNewPage} title="Create CMS Page" onClose={() => setShowNewPage(false)}>
        <div className="grid gap-4 p-4">
          <label className="grid gap-2 text-sm font-semibold">
            Page title
            <Input
              value={newPageForm.title}
              onChange={(e) => {
                const title = e.target.value;
                setNewPageForm((current) => ({
                  ...current,
                  title,
                  slug: current.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
                  navLabel: current.navLabel || title
                }));
              }}
              placeholder="New page name"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            URL slug
            <Input value={newPageForm.slug} onChange={(e) => setNewPageForm((current) => ({ ...current, slug: e.target.value }))} placeholder="new-page" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Navigation label
            <Input value={newPageForm.navLabel} onChange={(e) => setNewPageForm((current) => ({ ...current, navLabel: e.target.value }))} placeholder="Footer/header text" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Show page link
            <CustomSelect
              value={newPageForm.navPlacement}
              onChange={(value) => setNewPageForm((current) => ({ ...current, navPlacement: value as typeof current.navPlacement }))}
              options={[
                { value: "footer", label: "Footer only" },
                { value: "header", label: "Header dropdown" },
                { value: "both", label: "Header dropdown and footer" },
                { value: "hidden", label: "Hidden from navigation" }
              ]}
            />
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <Button variant="secondary" onClick={() => setShowNewPage(false)}>Cancel</Button>
            <Button onClick={createNewPage}>Create Page</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteSectionIndex !== null} title="Delete Section" onClose={() => setDeleteSectionIndex(null)}>
        <div className="p-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            This section will be removed from the page after you save changes. Are you sure you want to delete it?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteSectionIndex(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteSection(deleteSectionIndex ?? 0)}>
              <Trash2 className="h-4 w-4" />
              Delete section
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeletePageConfirm} title="Delete CMS Page" onClose={() => setShowDeletePageConfirm(false)}>
        <div className="p-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            This will delete the saved CMS database record for <strong>{draft?.title}</strong>. If this is a built-in template page, the default fallback content can appear again after reload.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeletePageConfirm(false)} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={deleteCurrentPage} disabled={saving || !draft || draft.slug === "home"}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete page
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showSaveConfirm} title="Save CMS Changes" onClose={() => setShowSaveConfirm(false)}>
        <div className="p-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            This will update the selected CMS page and its sections in the database. Public CMS pages will use this saved content immediately after refresh.
          </p>
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            Page: {draft?.title ?? "Selected page"} / Section: {currentSection?.label ?? "Current section"}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSaveConfirm(false)}>Cancel</Button>
            <Button onClick={savePage} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Badge Modal */}
      <Modal open={showBadgeModal} title="Add Badge to Title" onClose={() => setShowBadgeModal(false)}>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Badge Text
            </label>
            <Input
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="e.g., New, Featured, Premium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Icon (optional)
            </label>
            <Input
              value={badgeIcon}
              onChange={(e) => setBadgeIcon(e.target.value)}
              placeholder="e.g., star, target, lightbulb"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="secondary" onClick={() => setShowBadgeModal(false)}>
              Cancel
            </Button>
            <Button onClick={addBadgeToTitle} disabled={!badgeText}>
              Add Badge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
