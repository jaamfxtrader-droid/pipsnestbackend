import { LegalPage } from "@/components/layout/legal-page";
import { kycSections } from "@/lib/legal-content";

export default function KycPolicyPage() {
  return (
    <LegalPage
      title="Risk Disclosure, AML/KYC Policy, Responsible Trading Policy"
      eyebrow="Compliance"
      summary="This policy explains identity verification, AML controls, responsible trading expectations, trader responsibilities, and company review rights."
      sections={kycSections}
    />
  );
}
