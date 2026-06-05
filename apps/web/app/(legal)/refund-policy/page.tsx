import { LegalPage } from "@/components/layout/legal-page";
import { refundSections } from "@/lib/legal-content";

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
