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
    sections: [
      section("intro", "Intro", "About Us", "Built for disciplined traders and lean prop firm operations.", "PipNest Markets is structured as a production-ready prop firm platform with clean separation between public marketing, trader workflows, admin operations, and future trading server integrations.", 1),
      section("features", "Feature Cards", null, "Transparent operations for traders and admins", "Transparent rules, admin controls, and integration-ready services can be shaped from the CMS.", 2)
    ]
  },
  {
    slug: "funding-programs",
    title: "Choose the simulated capital track that fits your process.",
    content: "All programs are seeded into Prisma and exposed through the challenge API.",
    published: true,
    sections: [
      section("intro", "Intro", "Funding Programs", "Choose the simulated capital track that fits your process.", "All programs are seeded into Prisma and exposed through the challenge API.", 1)
    ]
  },
  {
    slug: "challenge-details",
    title: "Clear evaluation objectives with dashboard tracking.",
    content: "Profit target, drawdown, minimum day, and account status rules remain visible throughout the trader journey.",
    published: true,
    sections: [
      section("intro", "Intro", "Challenge Details", "Clear evaluation objectives with dashboard tracking.", "Profit target, drawdown, minimum day, and account status rules remain visible throughout the trader journey.", 1),
      section("rules", "Rules Table", null, "Rules traders can understand quickly", "Control the supporting rules section copy from the CMS while challenge values continue to come from platform data.", 2)
    ]
  },
  {
    slug: "how-it-works",
    title: "A complete funding workflow from account to payout.",
    content: "Register, purchase a challenge, trade within the rules, and request payouts from the dashboard.",
    published: true,
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
    sections: [
      section("intro", "Intro", "FAQ", "Common platform questions.", "Answers for funding, account assignment, coupons, affiliates, and future MT4/MT5 integrations.", 1),
      section("questions", "Questions", null, "Frequently asked questions", "Manage FAQ section framing from the CMS while detailed questions remain editable in code or future CMS fields.", 2)
    ]
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    content: "PipNest Markets provides simulated trading challenges and dashboard tooling. Final legal terms should be reviewed by counsel before production launch.",
    published: true,
    sections: [
      section("body", "Body", "Legal", "Terms & Conditions", "PipNest Markets provides simulated trading challenges and dashboard tooling. Final legal terms should be reviewed by counsel before production launch.", 1)
    ]
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    content: "The platform stores account, order, support, notification, and affiliate data in PostgreSQL through Prisma. Secrets must remain server-side and environment-based.",
    published: true,
    sections: [
      section("body", "Body", "Legal", "Privacy Policy", "The platform stores account, order, support, notification, and affiliate data in PostgreSQL through Prisma. Secrets must remain server-side and environment-based.", 1)
    ]
  },
  {
    slug: "risk-disclosure",
    title: "Risk Disclosure",
    content: "Trading involves risk. PipNest Markets challenge screens use simulated accounts and MT4/MT5-ready statistics while live Manager API integration is configured.",
    published: true,
    sections: [
      section("body", "Body", "Legal", "Risk Disclosure", "Trading involves risk. PipNest Markets challenge screens use simulated accounts and MT4/MT5-ready statistics while live Manager API integration is configured.", 1)
    ]
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    content: "Refund rules should be configured according to business policy. The schema includes order and payment statuses needed to track paid, failed, cancelled, and refunded states.",
    published: true,
    sections: [
      section("body", "Body", "Legal", "Refund Policy", "Refund rules should be configured according to business policy. The schema includes order and payment statuses needed to track paid, failed, cancelled, and refunded states.", 1)
    ]
  }
];

function mergeSections(defaultSections: CmsSection[] = [], remoteSections: CmsSection[] = []) {
  const merged = new Map(defaultSections.map((item) => [item.sectionKey, item]));
  remoteSections.forEach((item) => merged.set(item.sectionKey, { ...merged.get(item.sectionKey), ...item }));
  return Array.from(merged.values()).sort((first, second) => first.sortOrder - second.sortOrder);
}

export function mergeCmsPage(defaultPage: CmsPage | undefined, remotePage: CmsPage | undefined) {
  if (!defaultPage) return remotePage;
  if (!remotePage) return defaultPage;
  return {
    ...defaultPage,
    ...remotePage,
    sections: mergeSections(defaultPage.sections, remotePage.sections)
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
    return mergeCmsPage(fallback, payload.data.page);
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
    const merged = cmsPageDrafts.map((page) => mergeCmsPage(page, remoteBySlug.get(page.slug))!);
    payload.data.pages.forEach((page) => {
      if (!merged.some((item) => item.slug === page.slug)) merged.push(page);
    });
    return merged;
  } catch {
    return cmsPageDrafts;
  }
}
