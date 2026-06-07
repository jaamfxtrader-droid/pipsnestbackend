const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type SiteSettings = {
  androidAppUrl: string;
  androidAppEnabled: boolean;
  androidAppComingSoon: boolean;
  androidBadgeImageUrl?: string;
  iosAppUrl: string;
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
};

export type SocialLinkItem = {
  id: string;
  type: string;
  label: string;
  url: string;
  enabled: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  androidAppUrl: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "https://play.google.com/store/apps/details?id=com.pipnestfunding.app",
  androidAppEnabled: false,
  androidAppComingSoon: true,
  androidBadgeImageUrl: "",
  iosAppUrl: process.env.NEXT_PUBLIC_IOS_APP_URL ?? "https://apps.apple.com",
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

  return {
    androidAppUrl: typeof input.androidAppUrl === "string" && input.androidAppUrl.trim() ? input.androidAppUrl.trim() : defaultSiteSettings.androidAppUrl,
    androidAppEnabled: typeof input.androidAppEnabled === "boolean" ? input.androidAppEnabled : defaultSiteSettings.androidAppEnabled,
    androidAppComingSoon: typeof input.androidAppComingSoon === "boolean" ? input.androidAppComingSoon : defaultSiteSettings.androidAppComingSoon,
    androidBadgeImageUrl: typeof input.androidBadgeImageUrl === "string" ? input.androidBadgeImageUrl.trim() : defaultSiteSettings.androidBadgeImageUrl,
    iosAppUrl: typeof input.iosAppUrl === "string" && input.iosAppUrl.trim() ? input.iosAppUrl.trim() : defaultSiteSettings.iosAppUrl,
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
    socialItems
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
