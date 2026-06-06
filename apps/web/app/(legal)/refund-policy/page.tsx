import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { refundSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Refund Policy",
  description: "Review PipNest Markets refund policy for challenge fees, duplicate payments, technical issues, account violations, and exceptional refund reviews.",
  path: "/refund-policy",
  keywords: ["refund policy", "challenge fee refund", "duplicate payment"]
});

export default async function RefundPolicyPage() {
  const page = await getCmsPage("refund-policy");
  return (
    <LegalPage
      title={page?.title ?? "Refund Policy"}
      eyebrow="Payments"
      summary={page?.content ?? "This policy explains how challenge fees, duplicate payments, account violations, funded accounts, and exceptional refund requests are handled."}
      sections={cmsLegalSections(page, refundSections)}
    />
  );
}
