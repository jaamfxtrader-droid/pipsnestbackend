import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Challenge Details",
  description: "Review PipNest Markets challenge rules, profit targets, drawdown limits, minimum trading days, and funded trader evaluation requirements.",
  path: "/challenge-details",
  keywords: ["challenge rules", "drawdown rules", "profit target"]
});

export default function ChallengeDetailsPage() {
  return <CmsPageView slug="challenge-details" fallbackTitle="Challenge Details" />;
}
