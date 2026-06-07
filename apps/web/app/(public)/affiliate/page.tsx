import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Affiliate Program",
  description: "Join the PipNest Markets affiliate program to refer traders, track conversions, and monitor commission performance from your dashboard.",
  path: "/affiliate",
  keywords: ["prop firm affiliate", "trading affiliate program", "referral commissions"]
});

export default function AffiliatePage() {
  return <CmsPageView slug="affiliate" fallbackTitle="Affiliate Program" />;
}
