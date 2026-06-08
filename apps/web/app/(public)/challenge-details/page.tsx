import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { challengeRulesSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Challenge Details",
  description: "Review PipNest Markets challenge rules, profit targets, drawdown limits, minimum trading days, and funded trader evaluation requirements.",
  path: "/challenge-details",
  keywords: ["challenge rules", "drawdown rules", "profit target"]
});

export default async function ChallengeDetailsPage() {
  const page = await getCmsPage("challenge-details");
  return (
    <LegalPage
      title={page?.title ?? "Challenge Rules"}
      eyebrow="Rules"
      summary={page?.content ?? "Review the core evaluation rules, drawdown expectations, minimum trading day requirements, account conduct standards, and payout eligibility notes before starting a challenge."}
      sections={cmsLegalSections(page, challengeRulesSections)}
    />
  );
}
