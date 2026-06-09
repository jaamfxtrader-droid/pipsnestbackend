export type FundingIconName = "Trophy" | "BadgeDollarSign" | "BarChart3" | "ShieldCheck" | "CheckCircle2" | "Target" | "DollarSign";

export type FundingHeroStat = {
  id: string;
  icon: FundingIconName;
  value: string;
  label: string;
  visible?: boolean;
};

export type FundingFeatureItem = {
  id: string;
  icon: FundingIconName;
  label: string;
  visible?: boolean;
};

export type FundingCta = {
  id: string;
  icon?: FundingIconName;
  label: string;
  href: string;
  style: "primary" | "secondary";
  visible?: boolean;
};

export type FundingPageContent = {
  heroStats: FundingHeroStat[];
  featureItems: FundingFeatureItem[];
  ctas: FundingCta[];
};

export const fundingIconOptions: Array<{ value: FundingIconName; label: string }> = [
  { value: "Trophy", label: "Trophy" },
  { value: "BadgeDollarSign", label: "Dollar badge" },
  { value: "BarChart3", label: "Chart bars" },
  { value: "ShieldCheck", label: "Shield check" },
  { value: "CheckCircle2", label: "Check circle" },
  { value: "Target", label: "Target" },
  { value: "DollarSign", label: "Dollar sign" }
];

export const defaultFundingPageContent: FundingPageContent = {
  heroStats: [
    { id: "routes", icon: "Trophy", value: "Live", label: "Routes", visible: true },
    { id: "split", icon: "BadgeDollarSign", value: "80%", label: "Split", visible: true },
    { id: "leverage", icon: "BarChart3", value: "1:100", label: "Leverage", visible: true }
  ],
  featureItems: [
    { id: "rules", icon: "ShieldCheck", label: "Clear evaluation rules", visible: true },
    { id: "workflow", icon: "BarChart3", label: "MT4/MT5-ready workflow", visible: true },
    { id: "tracking", icon: "CheckCircle2", label: "Dashboard purchase tracking", visible: true }
  ],
  ctas: [
    { id: "start", icon: "Target", label: "Start now", href: "/auth/register", style: "primary", visible: true },
    { id: "rules", icon: "ShieldCheck", label: "View rules", href: "/challenge-details", style: "secondary", visible: true }
  ]
};

function normalizeArray<T extends { id: string; visible?: boolean }>(value: unknown, fallback: T[]) {
  if (!Array.isArray(value)) return fallback;
  return value.map((rawItem, index) => {
    const item = typeof rawItem === "object" && rawItem ? (rawItem as Record<string, any>) : {};
    return { ...fallback[index % fallback.length], ...item, id: String(item.id ?? fallback[index]?.id ?? index), visible: item.visible !== false };
  }) as T[];
}

export function parseFundingPageContent(metadata?: Record<string, any> | null): FundingPageContent {
  return {
    heroStats: normalizeArray<FundingHeroStat>(metadata?.heroStats, defaultFundingPageContent.heroStats),
    featureItems: normalizeArray<FundingFeatureItem>(metadata?.featureItems, defaultFundingPageContent.featureItems),
    ctas: normalizeArray<FundingCta>(metadata?.ctas, defaultFundingPageContent.ctas)
  };
}
