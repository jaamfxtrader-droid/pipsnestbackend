import { PayoutsMarketingPage } from "@/components/marketing/payouts-marketing-page";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Payouts",
  description: "Explore PipNest Markets payout workflow, payout tracking, trader dashboard ledger, and funded account withdrawal review process.",
  path: "/payouts",
  keywords: ["funded trader payouts", "profit split", "payout tracking"]
});

export default async function PayoutsPage() {
  const page = await getCmsPage("payouts");
  const intro = getCmsSection(page, "intro");
  const workflow = getCmsSection(page, "workflow");

  return <PayoutsMarketingPage page={page} intro={intro} workflowSection={workflow} />;
}
