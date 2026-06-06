import { LegalPage } from "@/components/layout/legal-page";
import { refundSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Refund Policy",
  description: "Review PipNest Markets refund policy for challenge fees, duplicate payments, technical issues, account violations, and exceptional refund reviews.",
  path: "/refund-policy",
  keywords: ["refund policy", "challenge fee refund", "duplicate payment"]
});

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      eyebrow="Payments"
      summary="This policy explains how challenge fees, duplicate payments, account violations, funded accounts, and exceptional refund requests are handled."
      sections={refundSections}
    />
  );
}
