export type PayoutIconName = "BadgeDollarSign" | "BarChart3" | "CheckCircle2" | "Clock3" | "ShieldCheck" | "Target" | "DollarSign";

export type PayoutMetric = {
  id: string;
  icon: PayoutIconName;
  value: string;
  label: string;
  helper: string;
  visible?: boolean;
};

export type PayoutCard = {
  id: string;
  icon: PayoutIconName;
  title: string;
  content: string;
  visible?: boolean;
};

export type PayoutCta = {
  id: string;
  label: string;
  href: string;
  style: "primary" | "secondary";
  visible?: boolean;
};

export type PayoutsPageContent = {
  metrics: PayoutMetric[];
  workflow: PayoutCard[];
  methods: PayoutCard[];
  trustCards: PayoutCard[];
  ctas: PayoutCta[];
};

export const payoutIconOptions: Array<{ value: PayoutIconName; label: string }> = [
  { value: "BadgeDollarSign", label: "Payout" },
  { value: "BarChart3", label: "Ledger" },
  { value: "CheckCircle2", label: "Approved" },
  { value: "Clock3", label: "Review time" },
  { value: "ShieldCheck", label: "Verification" },
  { value: "Target", label: "Target" },
  { value: "DollarSign", label: "Dollar" }
];

export const defaultPayoutsPageContent: PayoutsPageContent = {
  metrics: [
    { id: "review", icon: "Clock3", value: "24h+", label: "Review window", helper: "Payout requests move through admin review before release.", visible: true },
    { id: "split", icon: "BadgeDollarSign", value: "Up to 80%", label: "Profit split", helper: "Eligible funded traders can request withdrawable profits.", visible: true },
    { id: "ledger", icon: "BarChart3", value: "Live", label: "Ledger tracking", helper: "Every request keeps status and history visible in the dashboard.", visible: true }
  ],
  workflow: [
    { id: "eligible", icon: "Target", title: "Reach payout eligibility", content: "Complete the required trading conditions, minimum days, and risk checks for your account.", visible: true },
    { id: "request", icon: "BadgeDollarSign", title: "Submit a payout request", content: "Choose a payout method, enter the amount, and provide the required payout details.", visible: true },
    { id: "review", icon: "ShieldCheck", title: "Admin review and verification", content: "The team reviews account status, compliance, payout details, and any security holds.", visible: true },
    { id: "paid", icon: "CheckCircle2", title: "Approved and marked paid", content: "Once processed, the payout ledger updates and certificate details can be attached.", visible: true }
  ],
  methods: [
    { id: "bank", icon: "DollarSign", title: "Bank transfer", content: "Use verified bank details where supported by your region and account status.", visible: true },
    { id: "crypto", icon: "BadgeDollarSign", title: "Crypto payouts", content: "Submit supported wallet details for eligible crypto payout requests.", visible: true },
    { id: "gateway", icon: "CheckCircle2", title: "Approved gateways", content: "Additional payout gateways can be reviewed and approved by the operations team.", visible: true }
  ],
  trustCards: [
    { id: "security", icon: "ShieldCheck", title: "Security holds are visible", content: "Password changes and account restrictions can temporarily lock payout requests.", visible: true },
    { id: "status", icon: "BarChart3", title: "Status is transparent", content: "Pending, approved, paid, and rejected states stay visible from the trader area.", visible: true },
    { id: "history", icon: "Clock3", title: "History stays organized", content: "Payout history, method, details, and certificates remain attached to the ledger.", visible: true }
  ],
  ctas: [
    { id: "dashboard", label: "Open payout dashboard", href: "/dashboard/payouts", style: "primary", visible: true },
    { id: "rules", label: "View challenge rules", href: "/challenge-details", style: "secondary", visible: true }
  ]
};

function normalizeArray<T extends { id: string; visible?: boolean }>(value: unknown, fallback: T[]) {
  if (!Array.isArray(value)) return fallback;
  return value.map((rawItem, index) => {
    const item = typeof rawItem === "object" && rawItem ? (rawItem as Record<string, any>) : {};
    return { ...fallback[index % fallback.length], ...item, id: String(item.id ?? fallback[index]?.id ?? index), visible: item.visible !== false };
  }) as T[];
}

export function parsePayoutsPageContent(metadata?: Record<string, any> | null): PayoutsPageContent {
  return {
    metrics: normalizeArray<PayoutMetric>(metadata?.metrics, defaultPayoutsPageContent.metrics),
    workflow: normalizeArray<PayoutCard>(metadata?.workflow, defaultPayoutsPageContent.workflow),
    methods: normalizeArray<PayoutCard>(metadata?.methods, defaultPayoutsPageContent.methods),
    trustCards: normalizeArray<PayoutCard>(metadata?.trustCards, defaultPayoutsPageContent.trustCards),
    ctas: normalizeArray<PayoutCta>(metadata?.ctas, defaultPayoutsPageContent.ctas)
  };
}
