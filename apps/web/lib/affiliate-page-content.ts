export type AffiliateIconName = "BadgeDollarSign" | "BarChart3" | "CheckCircle2" | "ShieldCheck" | "Target" | "Trophy" | "Users";

export type AffiliateMetric = {
  id: string;
  icon: AffiliateIconName;
  value: string;
  label: string;
  helper: string;
  visible?: boolean;
};

export type AffiliateCard = {
  id: string;
  icon: AffiliateIconName;
  title: string;
  content: string;
  visible?: boolean;
};

export type AffiliateCta = {
  id: string;
  label: string;
  href: string;
  style: "primary" | "secondary";
  visible?: boolean;
};

export type AffiliatePageContent = {
  metrics: AffiliateMetric[];
  steps: AffiliateCard[];
  benefits: AffiliateCard[];
  ctas: AffiliateCta[];
};

export const affiliateIconOptions: Array<{ value: AffiliateIconName; label: string }> = [
  { value: "BadgeDollarSign", label: "Commission" },
  { value: "BarChart3", label: "Tracking" },
  { value: "CheckCircle2", label: "Approved" },
  { value: "ShieldCheck", label: "Protected" },
  { value: "Target", label: "Target" },
  { value: "Trophy", label: "Reward" },
  { value: "Users", label: "Users" }
];

export const defaultAffiliatePageContent: AffiliatePageContent = {
  metrics: [
    { id: "rate", icon: "BadgeDollarSign", value: "10%", label: "Commission", helper: "Default tracked rate on eligible referrals.", visible: true },
    { id: "tracking", icon: "BarChart3", value: "Live", label: "Tracking", helper: "Conversions appear inside the affiliate dashboard.", visible: true },
    { id: "payouts", icon: "CheckCircle2", value: "Fast", label: "Payout review", helper: "Approved commissions can be monitored from one place.", visible: true }
  ],
  steps: [
    { id: "share", icon: "Users", title: "Share your referral link", content: "Every trader account receives a unique affiliate code and dashboard link.", visible: true },
    { id: "convert", icon: "Target", title: "Bring qualified traders", content: "New signups are connected to your account when they register through your link.", visible: true },
    { id: "track", icon: "BarChart3", title: "Track commission progress", content: "Monitor referred users, conversion status, commission rate, and payout-ready amounts.", visible: true }
  ],
  benefits: [
    { id: "transparent", icon: "ShieldCheck", title: "Transparent ledger", content: "Referral activity is stored in the platform and visible from the trader dashboard.", visible: true },
    { id: "brand", icon: "Trophy", title: "Promote a funded trader offer", content: "Send traders to a complete challenge platform with funding, dashboards, payouts, and support.", visible: true },
    { id: "support", icon: "CheckCircle2", title: "Simple partner workflow", content: "Share links, monitor conversions, and keep commission history organized without manual spreadsheets.", visible: true }
  ],
  ctas: [
    { id: "join", label: "Become an affiliate", href: "/dashboard/affiliate", style: "primary", visible: true },
    { id: "programs", label: "View funding programs", href: "/funding-programs", style: "secondary", visible: true }
  ]
};

function normalizeArray<T extends { id: string; visible?: boolean }>(value: unknown, fallback: T[]) {
  if (!Array.isArray(value)) return fallback;
  return value.map((rawItem, index) => {
    const item = typeof rawItem === "object" && rawItem ? (rawItem as Record<string, any>) : {};
    return { ...fallback[index % fallback.length], ...item, id: String(item.id ?? fallback[index]?.id ?? index), visible: item.visible !== false };
  }) as T[];
}

export function parseAffiliatePageContent(metadata?: Record<string, any> | null): AffiliatePageContent {
  return {
    metrics: normalizeArray<AffiliateMetric>(metadata?.metrics, defaultAffiliatePageContent.metrics),
    steps: normalizeArray<AffiliateCard>(metadata?.steps, defaultAffiliatePageContent.steps),
    benefits: normalizeArray<AffiliateCard>(metadata?.benefits, defaultAffiliatePageContent.benefits),
    ctas: normalizeArray<AffiliateCta>(metadata?.ctas, defaultAffiliatePageContent.ctas)
  };
}
