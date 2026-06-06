const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type SiteSettings = {
  androidAppUrl: string;
  androidAppEnabled: boolean;
  androidAppComingSoon: boolean;
  iosAppUrl: string;
  iosAppEnabled: boolean;
  iosAppComingSoon: boolean;
  socialLinks: {
    instagram: string;
    youtube: string;
    linkedin: string;
    telegram: string;
  };
};

export const defaultSiteSettings: SiteSettings = {
  androidAppUrl: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "https://play.google.com/store/apps/details?id=com.pipnestfunding.app",
  androidAppEnabled: false,
  androidAppComingSoon: true,
  iosAppUrl: process.env.NEXT_PUBLIC_IOS_APP_URL ?? "https://apps.apple.com",
  iosAppEnabled: false,
  iosAppComingSoon: true,
  socialLinks: {
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    linkedin: "https://linkedin.com",
    telegram: "https://t.me"
  }
};

export function normalizeSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") return defaultSiteSettings;

  const input = value as Partial<SiteSettings>;
  const socialLinks: Partial<SiteSettings["socialLinks"]> =
    input.socialLinks && typeof input.socialLinks === "object" ? input.socialLinks : {};

  return {
    androidAppUrl: typeof input.androidAppUrl === "string" && input.androidAppUrl.trim() ? input.androidAppUrl.trim() : defaultSiteSettings.androidAppUrl,
    androidAppEnabled: typeof input.androidAppEnabled === "boolean" ? input.androidAppEnabled : defaultSiteSettings.androidAppEnabled,
    androidAppComingSoon: typeof input.androidAppComingSoon === "boolean" ? input.androidAppComingSoon : defaultSiteSettings.androidAppComingSoon,
    iosAppUrl: typeof input.iosAppUrl === "string" && input.iosAppUrl.trim() ? input.iosAppUrl.trim() : defaultSiteSettings.iosAppUrl,
    iosAppEnabled: typeof input.iosAppEnabled === "boolean" ? input.iosAppEnabled : defaultSiteSettings.iosAppEnabled,
    iosAppComingSoon: typeof input.iosAppComingSoon === "boolean" ? input.iosAppComingSoon : defaultSiteSettings.iosAppComingSoon,
    socialLinks: {
      instagram:
        typeof socialLinks.instagram === "string" && socialLinks.instagram.trim() ? socialLinks.instagram.trim() : defaultSiteSettings.socialLinks.instagram,
      youtube: typeof socialLinks.youtube === "string" && socialLinks.youtube.trim() ? socialLinks.youtube.trim() : defaultSiteSettings.socialLinks.youtube,
      linkedin:
        typeof socialLinks.linkedin === "string" && socialLinks.linkedin.trim() ? socialLinks.linkedin.trim() : defaultSiteSettings.socialLinks.linkedin,
      telegram:
        typeof socialLinks.telegram === "string" && socialLinks.telegram.trim() ? socialLinks.telegram.trim() : defaultSiteSettings.socialLinks.telegram
    }
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
