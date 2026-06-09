const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type SiteSettings = {
  footerText: string;
  footerCopyright: string;
  androidAppUrl: string;
  androidBadgeVisible: boolean;
  androidAppEnabled: boolean;
  androidAppComingSoon: boolean;
  androidBadgeImageUrl?: string;
  iosAppUrl: string;
  iosBadgeVisible: boolean;
  iosAppEnabled: boolean;
  iosAppComingSoon: boolean;
  iosBadgeImageUrl?: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    linkedin: string;
    telegram: string;
  };
  socialItems: SocialLinkItem[];
  paymentBadges: PaymentBadgeItem[];
};

export type PaymentBadgeItem = {
  id: string;
  label: string;
  icon: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  enabled: boolean;
};

export type SocialLinkItem = {
  id: string;
  type: string;
  label: string;
  url: string;
  enabled: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  footerText: "Simulated funding evaluations, trader analytics, manual account assignment, and a clean API layer ready for future MT4/MT5 Manager integration.",
  footerCopyright: "© 2026 PipNest Markets. All rights reserved.",
  androidAppUrl: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "https://play.google.com/store/apps/details?id=com.pipnestfunding.app",
  androidBadgeVisible: true,
  androidAppEnabled: false,
  androidAppComingSoon: true,
  androidBadgeImageUrl: "",
  iosAppUrl: process.env.NEXT_PUBLIC_IOS_APP_URL ?? "https://apps.apple.com",
  iosBadgeVisible: true,
  iosAppEnabled: false,
  iosAppComingSoon: true,
  iosBadgeImageUrl: "",
  socialLinks: {
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    linkedin: "https://linkedin.com",
    telegram: "https://t.me"
  },
  socialItems: [
    { id: "instagram", type: "instagram", label: "Instagram", url: "https://instagram.com", enabled: true },
    { id: "youtube", type: "youtube", label: "YouTube", url: "https://youtube.com", enabled: true },
    { id: "linkedin", type: "linkedin", label: "LinkedIn", url: "https://linkedin.com", enabled: true },
    { id: "telegram", type: "telegram", label: "Telegram", url: "https://t.me", enabled: true }
  ],
  paymentBadges: [
    { id: "visa", label: "Visa", icon: "CreditCard", textColor: "#1d4ed8", backgroundColor: "#3b82f6", borderColor: "#60a5fa", enabled: true },
    { id: "mastercard", label: "Mastercard", icon: "CreditCard", textColor: "#be123c", backgroundColor: "#f43f5e", borderColor: "#fb7185", enabled: true },
    { id: "bank", label: "Bank", icon: "Landmark", textColor: "#047857", backgroundColor: "#10b981", borderColor: "#34d399", enabled: true },
    { id: "crypto", label: "Crypto", icon: "Wallet", textColor: "#0e7490", backgroundColor: "#06b6d4", borderColor: "#22d3ee", enabled: true },
    { id: "airtm", label: "Airtm", icon: "Wallet", textColor: "#6d28d9", backgroundColor: "#8b5cf6", borderColor: "#a78bfa", enabled: true },
    { id: "skrill", label: "Skrill", icon: "Wallet", textColor: "#a21caf", backgroundColor: "#d946ef", borderColor: "#e879f9", enabled: true }
  ]
};

export function normalizeSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") return defaultSiteSettings;

  const input = value as Partial<SiteSettings>;
  const socialLinks: Partial<SiteSettings["socialLinks"]> =
    input.socialLinks && typeof input.socialLinks === "object" ? input.socialLinks : {};
  const legacySocialItems = defaultSiteSettings.socialItems.map((item) => ({
    ...item,
    url: typeof socialLinks[item.type as keyof SiteSettings["socialLinks"]] === "string" ? socialLinks[item.type as keyof SiteSettings["socialLinks"]] || item.url : item.url
  }));
  const socialItems = Array.isArray(input.socialItems)
    ? (input.socialItems as unknown[])
        .filter((item): item is Partial<SocialLinkItem> => Boolean(item) && typeof item === "object")
        .map((item, index) => {
          const fallback = legacySocialItems[index] ?? defaultSiteSettings.socialItems[0];
          const type = typeof item.type === "string" && item.type.trim() ? item.type.trim() : fallback.type;
          const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : type;

          return {
            id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `${type}-${index + 1}`,
            type,
            label,
            url: typeof item.url === "string" ? item.url.trim() : "",
            enabled: typeof item.enabled === "boolean" ? item.enabled : true
          };
        })
    : legacySocialItems;
  const paymentBadges = Array.isArray(input.paymentBadges)
    ? (input.paymentBadges as unknown[])
        .filter((item): item is Partial<PaymentBadgeItem> => Boolean(item) && typeof item === "object")
        .map((item, index) => {
          const fallback = defaultSiteSettings.paymentBadges[index] ?? defaultSiteSettings.paymentBadges[0];
          return {
            id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `payment-${index + 1}`,
            label: typeof item.label === "string" ? item.label : fallback.label,
            icon: typeof item.icon === "string" ? item.icon : fallback.icon,
            textColor: typeof item.textColor === "string" ? item.textColor : fallback.textColor,
            backgroundColor: typeof item.backgroundColor === "string" ? item.backgroundColor : fallback.backgroundColor,
            borderColor: typeof item.borderColor === "string" ? item.borderColor : fallback.borderColor,
            enabled: typeof item.enabled === "boolean" ? item.enabled : true
          };
        })
    : defaultSiteSettings.paymentBadges;

  return {
    footerText: typeof input.footerText === "string" ? input.footerText : defaultSiteSettings.footerText,
    footerCopyright: typeof input.footerCopyright === "string" ? input.footerCopyright : defaultSiteSettings.footerCopyright,
    androidAppUrl: typeof input.androidAppUrl === "string" && input.androidAppUrl.trim() ? input.androidAppUrl.trim() : defaultSiteSettings.androidAppUrl,
    androidBadgeVisible: typeof input.androidBadgeVisible === "boolean" ? input.androidBadgeVisible : defaultSiteSettings.androidBadgeVisible,
    androidAppEnabled: typeof input.androidAppEnabled === "boolean" ? input.androidAppEnabled : defaultSiteSettings.androidAppEnabled,
    androidAppComingSoon: typeof input.androidAppComingSoon === "boolean" ? input.androidAppComingSoon : defaultSiteSettings.androidAppComingSoon,
    androidBadgeImageUrl: typeof input.androidBadgeImageUrl === "string" ? input.androidBadgeImageUrl.trim() : defaultSiteSettings.androidBadgeImageUrl,
    iosAppUrl: typeof input.iosAppUrl === "string" && input.iosAppUrl.trim() ? input.iosAppUrl.trim() : defaultSiteSettings.iosAppUrl,
    iosBadgeVisible: typeof input.iosBadgeVisible === "boolean" ? input.iosBadgeVisible : defaultSiteSettings.iosBadgeVisible,
    iosAppEnabled: typeof input.iosAppEnabled === "boolean" ? input.iosAppEnabled : defaultSiteSettings.iosAppEnabled,
    iosAppComingSoon: typeof input.iosAppComingSoon === "boolean" ? input.iosAppComingSoon : defaultSiteSettings.iosAppComingSoon,
    iosBadgeImageUrl: typeof input.iosBadgeImageUrl === "string" ? input.iosBadgeImageUrl.trim() : defaultSiteSettings.iosBadgeImageUrl,
    socialLinks: {
      instagram:
        typeof socialLinks.instagram === "string" && socialLinks.instagram.trim() ? socialLinks.instagram.trim() : defaultSiteSettings.socialLinks.instagram,
      youtube: typeof socialLinks.youtube === "string" && socialLinks.youtube.trim() ? socialLinks.youtube.trim() : defaultSiteSettings.socialLinks.youtube,
      linkedin:
        typeof socialLinks.linkedin === "string" && socialLinks.linkedin.trim() ? socialLinks.linkedin.trim() : defaultSiteSettings.socialLinks.linkedin,
      telegram:
        typeof socialLinks.telegram === "string" && socialLinks.telegram.trim() ? socialLinks.telegram.trim() : defaultSiteSettings.socialLinks.telegram
    },
    socialItems,
    paymentBadges
  };
}

export function parseSiteSettingsContent(content: string | null | undefined): SiteSettings {
  if (!content) return defaultSiteSettings;

  try {
    return normalizeSiteSettings(JSON.parse(content));
  } catch {
    return defaultSiteSettings;
  }
}

type SiteSettingsApiPayload = {
  data?: {
    page?: {
      content?: string | null;
    };
  };
  page?: {
    content?: string | null;
  };
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const response = await fetch(`${API_URL}/cms/site-settings`, { cache: "no-store" });
    if (!response.ok) return defaultSiteSettings;

    const payload = (await response.json()) as SiteSettingsApiPayload;
    return parseSiteSettingsContent(payload.data?.page?.content ?? payload.page?.content);
  } catch {
    return defaultSiteSettings;
  }
}
