import { AffiliateMarketingPage } from "@/components/marketing/affiliate-marketing-page";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Affiliate Program",
  description: "Join the PipNest Markets affiliate program to refer traders, track conversions, and monitor commission performance from your dashboard.",
  path: "/affiliate",
  keywords: ["prop firm affiliate", "trading affiliate program", "referral commissions"]
});

export default async function AffiliatePage() {
  const page = await getCmsPage("affiliate");
  const intro = getCmsSection(page, "intro");
  const linkSection = getCmsSection(page, "link");

  return <AffiliateMarketingPage page={page} intro={intro} linkSection={linkSection} />;
}
