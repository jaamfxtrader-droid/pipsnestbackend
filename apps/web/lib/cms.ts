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
import { defaultCmsFaqItems } from "@/lib/faq-page-content";
import { defaultAffiliatePageContent } from "@/lib/affiliate-page-content";
import { defaultFundingPageContent } from "@/lib/funding-page-content";
import { defaultPayoutsPageContent } from "@/lib/payouts-page-content";
import { defaultHowItWorksPageContent } from "@/lib/how-it-works-page-content";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type CmsSection = {
  id?: string;
  pageSlug?: string;
  sectionKey: string;
  label: string;
  eyebrow?: string | null;
  title: string;
  content: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  sortOrder: number;
  sectionType?: "block" | "grid" | "flex" | "carousel" | "media" | "split";
  imageUrl?: string | null;
  iconName?: string | null;
  colorScheme?: string | null;
  position?: number;
  metadata?: Record<string, any> | null;
  isVisible?: boolean;
  published?: boolean;
  updatedAt?: string;
};

export type CmsPage = {
  id?: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metadata?: Record<string, any>;
  published?: boolean;
  updatedAt?: string;
  sections?: CmsSection[];
};

type CmsPageResponse = {
  page: CmsPage;
};

type CmsPagesResponse = {
  pages: CmsPage[];
};

type ApiPayload<T> = {
  success: boolean;
  data: T;
};

const homeSections: CmsSection[] = [
  {
    sectionKey: "hero",
    label: "Hero Banner",
    eyebrow: "PipNest Markets",
    title: "Turn your trading skills into income",
    content: "Join a modern prop firm experience with challenge tracking, payouts, affiliate tools, and MT4/MT5-ready infrastructure.",
    ctaLabel: "Get Funded",
    ctaHref: "/funding-programs",
    sortOrder: 1,
    published: true
  },
  {
    sectionKey: "preview",
    label: "Terminal Preview",
    eyebrow: "Trade with peace of mind",
    title: "Pipnest terminal preview",
    content: "Preview equity, accounts, progress, and payout readiness from one clean trader terminal.",
    sortOrder: 2,
    published: true
  },
  {
    sectionKey: "how",
    label: "How It Works",
    eyebrow: "How it works",
    title: "Start in three simple steps",
    content: "Pick a challenge, follow the rules, and scale simulated firm capital from your dashboard.",
    sortOrder: 3,
    published: true
  },
  {
    sectionKey: "rank",
    label: "Rank Up",
    eyebrow: "Rank Up",
    title: "Your journey starts here",
    content: "Choose one-step or two-step evaluation paths with clear objectives and visible progress.",
    sortOrder: 4,
    published: true
  },
  {
    sectionKey: "journey",
    label: "Trader Journey",
    eyebrow: "Trader's Journey",
    title: "Track each milestone from challenge to payout",
    content: "Keep every stage visible, from purchase to funded status and payout requests.",
    sortOrder: 5,
    published: true
  },
  {
    sectionKey: "rewards",
    label: "Rewards",
    title: "Real traders, real rewards, real impact",
    content: "Highlight payouts, top allocations, fastest cycles, and simulated capital milestones.",
    sortOrder: 6,
    published: true
  },
  {
    sectionKey: "trade",
    label: "Trade Platforms",
    eyebrow: "Trade on your terms",
    title: "Choose your platform and keep your rules visible",
    content: "Show MT4/MT5 readiness, coupon flows, and affiliate tools in one brand section.",
    ctaLabel: "Start Trading",
    ctaHref: "/funding-programs",
    sortOrder: 7,
    published: true
  },
  {
    sectionKey: "capital",
    label: "Capital",
    eyebrow: "Your skill is our capital",
    title: "Get evaluated, get backed, and manage everything in one place",
    content: "Use challenge cards, payout cards, and secure trader workflows to keep operations clean.",
    sortOrder: 8,
    published: true
  },
  {
    sectionKey: "story",
    label: "Story",
    title: "Built by traders, for traders. Your growth is our mission.",
    content: "Pipnest is designed around disciplined trading: clear rules, transparent milestones, and a growth path that rewards consistency.",
    sortOrder: 9,
    published: true
  },
  {
    sectionKey: "dashboard",
    label: "Dashboard CTA",
    eyebrow: "Trader dashboard",
    title: "A trader workspace that keeps every rule visible.",
    content: "Track challenge progress, trading accounts, payout steps, and support from one clean dashboard built for daily use.",
    ctaLabel: "Explore Dashboard",
    ctaHref: "/dashboard",
    sortOrder: 10,
    published: true
  },
  {
    sectionKey: "mobile",
    label: "Mobile",
    eyebrow: "Meet Trader",
    title: "Meet the trader area that moves with you.",
    content:
      "Keep account status, equity, challenge rules, payout steps, and support close whether you are checking in from desktop or phone.",
    ctaLabel: "Create trader profile",
    ctaHref: "/dashboard",
    sortOrder: 11,
    published: true
  },
  {
    sectionKey: "final",
    label: "Final CTA",
    eyebrow: "Building Traders Globally Since 2022",
    title: "A complete prop firm platform under one roof",
    content: "Ready for launch content and production integrations.",
    ctaLabel: "Start your challenge",
    ctaHref: "/auth/register",
    sortOrder: 12,
    published: true
  }
];

function section(sectionKey: string, label: string, eyebrow: string | null, title: string, content: string, sortOrder: number, ctaLabel?: string, ctaHref?: string): CmsSection {
  return {
    sectionKey,
    label,
    eyebrow,
    title,
    content,
    ctaLabel,
    ctaHref,
    sortOrder,
    published: true
  };
}

function legalCmsSections(sections: LegalSection[]) {
  return sections.map((item, index) => ({
    sectionKey: `legal-${index + 1}`,
    label: item.title,
    eyebrow: null,
    title: item.title,
    content: item.body?.join("\n\n") ?? "",
    sortOrder: index + 1,
    sectionType: "block" as const,
    published: true,
    isVisible: true,
    metadata: item.bullets?.length ? { bullets: item.bullets } : undefined
  }));
}

const legalFallbackBySlug: Record<string, LegalSection[]> = {
  about: aboutSections,
  "challenge-details": challengeRulesSections,
  terms: termsSections,
  privacy: privacySections,
  disclaimer: disclaimerSections,
  "kyc-policy": kycSections,
  "risk-disclosure": riskSections,
  "refund-policy": refundSections,
  "account-deletion": accountDeletionSections
};

function shouldUseLegalFallbackSections(slug: string, remoteSections: CmsSection[] = []) {
  if (!legalFallbackBySlug[slug]) return false;
  if (remoteSections.length === 0) return true;
  return remoteSections.length === 1 && ["body", "legal-1"].includes(remoteSections[0]?.sectionKey ?? "") && legalFallbackBySlug[slug].length > 1;
}

export const cmsPageDrafts: CmsPage[] = [
  {
    slug: "home",
    title: "Turn your trading skills into income",
    content: "Join a modern prop firm experience with challenge tracking, payouts, affiliate tools, and MT4/MT5-ready infrastructure.",
    metaTitle: "PipNest Markets",
    metaDescription: "Modern simulated funding challenges for disciplined traders.",
    published: true,
    sections: homeSections
  },
  {
    slug: "about",
    title: "Built for disciplined traders and lean prop firm operations.",
    content:
      "PipNest Markets is structured as a production-ready prop firm platform with clean separation between public marketing, trader workflows, admin operations, and future trading server integrations.",
    published: true,
    sections: legalCmsSections(aboutSections)
  },
  {
    slug: "funding-programs",
    title: "Choose the simulated capital track that fits your process.",
    content: "All programs are seeded into Prisma and exposed through the challenge API.",
    published: true,
    metadata: defaultFundingPageContent,
    sections: [
      section("intro", "Intro", "Funding Programs", "Choose the simulated capital track that fits your process.", "All programs are seeded into Prisma and exposed through the challenge API.", 1)
    ]
  },
  {
    slug: "challenge-details",
    title: "Challenge Rules",
    content: "Review the core evaluation rules, drawdown expectations, minimum trading day requirements, account conduct standards, and payout eligibility notes before starting a challenge.",
    published: true,
    sections: legalCmsSections(challengeRulesSections)
  },
  {
    slug: "how-it-works",
    title: "A complete funding workflow from account to payout.",
    content: "Register, purchase a challenge, trade within the rules, and request payouts from the dashboard.",
    published: true,
    metadata: defaultHowItWorksPageContent,
    sections: [
      section("intro", "Intro", "How It Works", "A complete funding workflow from account to payout.", "Register, purchase a challenge, trade within the rules, and request payouts from the dashboard.", 1),
      section("steps", "Steps", null, "Four clear steps from signup to scale", "Edit the heading and supporting copy around the operational steps from the CMS.", 2)
    ]
  },
  {
    slug: "payouts",
    title: "Request, review, approve, and track payouts.",
    content: "Trader payout requests flow through admin review with status tracking and clear payout history.",
    published: true,
    metadata: defaultPayoutsPageContent,
    sections: [
      section("intro", "Intro", "Payouts", "Request, review, approve, and track payouts.", "Trader payout requests flow through admin review with status tracking and clear payout history.", 1),
      section("workflow", "Workflow", null, "A clean payout review workflow", "Explain payout submission, review, approval, and paid states from the CMS.", 2)
    ]
  },
  {
    slug: "affiliate",
    title: "Referral tracking and commission reporting are built in.",
    content: "Every user gets a referral code while the API tracks referred users, conversion status, commission rate, and payout-ready amounts.",
    published: true,
    metadata: defaultAffiliatePageContent,
    sections: [
      section("intro", "Intro", "Affiliate Program", "Referral tracking and commission reporting are built in.", "Every user gets a referral code while the API tracks referred users, conversion status, commission rate, and payout-ready amounts.", 1, "Become an Affiliate", "/dashboard/affiliate"),
      section("link", "Referral Link", null, "Demo referral link", "Control helper copy for the referral-link card from the CMS.", 2)
    ]
  },
  {
    slug: "contact",
    title: "Talk to Pipnest support.",
    content: "Use the support ticket system inside the dashboard for account requests, or reach out through the contact form for general inquiries.",
    published: true,
    sections: [
      section("intro", "Intro", "Contact Us", "Talk to Pipnest support.", "Use the support ticket system inside the dashboard for account requests, or reach out through the contact form for general inquiries.", 1),
      section("form", "Contact Form", null, "Send a message to support", "Customize contact-form helper copy and operations notes from the CMS.", 2)
    ]
  },
  {
    slug: "faq",
    title: "Common platform questions.",
    content: "Answers for funding, account assignment, coupons, affiliates, and future MT4/MT5 integrations.",
    published: true,
    metadata: { faqItems: defaultCmsFaqItems },
    sections: [
      section("intro", "Intro", "FAQ", "Common platform questions.", "Answers for funding, account assignment, coupons, affiliates, and future MT4/MT5 integrations.", 1),
      section("questions", "Questions", null, "Frequently asked questions", "Manage FAQ questions from the CMS. Add, edit, hide, or remove questions from the admin panel.", 2)
    ]
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    content: "PipNest Markets provides simulated trading challenges and dashboard tooling. Final legal terms should be reviewed by counsel before production launch.",
    published: true,
    sections: legalCmsSections(termsSections)
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    content: "This Privacy Policy explains how PipNest Markets collects, uses, stores, shares, and protects personal information when users access the website and services.",
    published: true,
    sections: legalCmsSections(privacySections)
  },
  {
    slug: "risk-disclosure",
    title: "Risk Disclosure",
    content: "Trading financial markets involves substantial risk. PipNest Markets accounts operate in a simulated environment for educational and evaluation purposes.",
    published: true,
    sections: legalCmsSections(riskSections)
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    content: "This policy explains how challenge fees, duplicate payments, account violations, funded accounts, and exceptional refund requests are handled.",
    published: true,
    sections: legalCmsSections(refundSections)
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    content: "This disclaimer explains the simulated trading setup, service-fee structure, absence of investment services, and general risk warnings for PipNest Markets programs.",
    published: true,
    sections: legalCmsSections(disclaimerSections)
  },
  {
    slug: "kyc-policy",
    title: "Risk Disclosure, AML/KYC Policy, Responsible Trading Policy",
    content: "This policy explains identity verification, AML controls, responsible trading expectations, trader responsibilities, and company review rights.",
    published: true,
    sections: legalCmsSections(kycSections)
  },
  {
    slug: "account-deletion",
    title: "Account Deletion",
    content: "How PipNest Markets users can request deletion of their account and associated personal data.",
    published: true,
    sections: legalCmsSections(accountDeletionSections)
  },
  {
    slug: "layout-rules",
    title: "Layout Rules",
    content: "Use this page to publish platform layout rules, trading notes, and customer-facing operational guidance.",
    published: true,
    sections: [
      section("body", "Body", "Rules", "Layout Rules", "Use this page to publish platform layout rules, trading notes, and customer-facing operational guidance.", 1)
    ]
  }
];

function sortSections(sections: CmsSection[] = []) {
  return [...sections].sort((first, second) => first.sortOrder - second.sortOrder);
}

function mergeSections(defaultSections: CmsSection[] = [], remoteSections: CmsSection[] = []) {
  const merged = new Map(defaultSections.map((item) => [item.sectionKey, item]));
  remoteSections.forEach((item) => merged.set(item.sectionKey, { ...merged.get(item.sectionKey), ...item }));
  return sortSections(Array.from(merged.values()));
}

export function mergeCmsPage(
  defaultPage: CmsPage | undefined,
  remotePage: CmsPage | undefined,
  options: { mergeDefaultSections?: boolean } = { mergeDefaultSections: true }
) {
  if (!defaultPage) return remotePage ? { ...remotePage, sections: sortSections(remotePage.sections) } : remotePage;
  if (!remotePage) return defaultPage;
  if (options.mergeDefaultSections === false && shouldUseLegalFallbackSections(remotePage.slug, remotePage.sections)) {
    return {
      ...defaultPage,
      ...remotePage,
      sections: legalCmsSections(legalFallbackBySlug[remotePage.slug])
    };
  }
  return {
    ...defaultPage,
    ...remotePage,
    sections: options.mergeDefaultSections === false ? sortSections(remotePage.sections) : mergeSections(defaultPage.sections, remotePage.sections)
  };
}

export function getDefaultCmsPage(slug: string) {
  return cmsPageDrafts.find((page) => page.slug === slug);
}

export function getCmsSection(page: CmsPage | undefined, sectionKey: string) {
  return page?.sections?.find((item) => item.sectionKey === sectionKey && item.published !== false);
}

export async function getCmsPage(slug: string): Promise<CmsPage | undefined> {
  const fallback = getDefaultCmsPage(slug);

  try {
    const response = await fetch(`${API_URL}/cms/${encodeURIComponent(slug)}`, {
      cache: "no-store"
    });

    if (!response.ok) return fallback;
    const payload = (await response.json()) as ApiPayload<CmsPageResponse>;
    return mergeCmsPage(fallback, payload.data.page, { mergeDefaultSections: slug === "home" });
  } catch {
    return fallback;
  }
}

export async function getCmsPages(): Promise<CmsPage[]> {
  try {
    const response = await fetch(`${API_URL}/cms`, { cache: "no-store" });
    if (!response.ok) return cmsPageDrafts;
    const payload = (await response.json()) as ApiPayload<CmsPagesResponse>;
    if (!payload.data.pages.length) return cmsPageDrafts;
    const remoteBySlug = new Map(payload.data.pages.map((page) => [page.slug, page]));
    const merged = cmsPageDrafts.map((page) => {
      const remotePage = remoteBySlug.get(page.slug);
      return mergeCmsPage(page, remotePage, { mergeDefaultSections: !remotePage || page.slug === "home" })!;
    });
    payload.data.pages.forEach((page) => {
      if (!merged.some((item) => item.slug === page.slug)) merged.push(page);
    });
    return merged;
  } catch {
    return cmsPageDrafts;
  }
}
