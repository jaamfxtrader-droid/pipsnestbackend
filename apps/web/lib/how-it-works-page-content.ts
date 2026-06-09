export type HowIconName = "BadgeDollarSign" | "BarChart3" | "CheckCircle2" | "Clock3" | "ShieldCheck" | "Target" | "Trophy";

export type HowStep = {
  id: string;
  icon: HowIconName;
  title: string;
  content: string;
  helper: string;
  visible?: boolean;
};

export type HowMetric = {
  id: string;
  icon: HowIconName;
  value: string;
  label: string;
  visible?: boolean;
};

export type HowCta = {
  id: string;
  label: string;
  href: string;
  style: "primary" | "secondary";
  visible?: boolean;
};

export type HowItWorksPageContent = {
  metrics: HowMetric[];
  steps: HowStep[];
  ctas: HowCta[];
};

export const howIconOptions: Array<{ value: HowIconName; label: string }> = [
  { value: "BadgeDollarSign", label: "Payment" },
  { value: "BarChart3", label: "Progress" },
  { value: "CheckCircle2", label: "Complete" },
  { value: "Clock3", label: "Timing" },
  { value: "ShieldCheck", label: "Rules" },
  { value: "Target", label: "Target" },
  { value: "Trophy", label: "Reward" }
];

export const defaultHowItWorksPageContent: HowItWorksPageContent = {
  metrics: [
    { id: "steps", icon: "Target", value: "4", label: "Core steps", visible: true },
    { id: "tracking", icon: "BarChart3", value: "Live", label: "Dashboard tracking", visible: true },
    { id: "payouts", icon: "BadgeDollarSign", value: "Clear", label: "Payout path", visible: true }
  ],
  steps: [
    {
      id: "register",
      icon: "Target",
      title: "Create your trader profile",
      content: "Register your account, verify access, and prepare your dashboard workspace.",
      helper: "Start with a secure trader account.",
      visible: true
    },
    {
      id: "challenge",
      icon: "BadgeDollarSign",
      title: "Choose and purchase a challenge",
      content: "Compare account sizes, pricing, phase counts, and rules before buying.",
      helper: "Pick the route that fits your trading process.",
      visible: true
    },
    {
      id: "trade",
      icon: "ShieldCheck",
      title: "Trade within the rules",
      content: "Keep profit targets, drawdown limits, minimum days, and account status visible.",
      helper: "Consistency and risk control matter most.",
      visible: true
    },
    {
      id: "scale",
      icon: "Trophy",
      title: "Request payouts and scale",
      content: "Eligible traders can request payouts, track review status, and grow through the platform.",
      helper: "Move from challenge progress to payout readiness.",
      visible: true
    }
  ],
  ctas: [
    { id: "start", label: "Start a challenge", href: "/funding-programs", style: "primary", visible: true },
    { id: "rules", label: "Review rules", href: "/challenge-details", style: "secondary", visible: true }
  ]
};

function normalizeArray<T extends { id: string; visible?: boolean }>(value: unknown, fallback: T[]) {
  if (!Array.isArray(value)) return fallback;
  return value.map((rawItem, index) => {
    const item = typeof rawItem === "object" && rawItem ? (rawItem as Record<string, any>) : {};
    return { ...fallback[index % fallback.length], ...item, id: String(item.id ?? fallback[index]?.id ?? index), visible: item.visible !== false };
  }) as T[];
}

export function parseHowItWorksPageContent(metadata?: Record<string, any> | null): HowItWorksPageContent {
  return {
    metrics: normalizeArray<HowMetric>(metadata?.metrics, defaultHowItWorksPageContent.metrics),
    steps: normalizeArray<HowStep>(metadata?.steps, defaultHowItWorksPageContent.steps),
    ctas: normalizeArray<HowCta>(metadata?.ctas, defaultHowItWorksPageContent.ctas)
  };
}
