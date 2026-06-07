import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Payouts",
  description: "Explore PipNest Markets payout workflow, payout tracking, trader dashboard ledger, and funded account withdrawal review process.",
  path: "/payouts",
  keywords: ["funded trader payouts", "profit split", "payout tracking"]
});

export default function PayoutsPage() {
  return <CmsPageView slug="payouts" fallbackTitle="Payouts" />;
}
