import { LegalPage } from "@/components/layout/legal-page";
import { kycSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "KYC Policy",
  description: "Learn how PipNest Markets handles identity verification, KYC reviews, anti-money-laundering checks, account security, and payout verification.",
  path: "/kyc-policy",
  keywords: ["KYC policy", "identity verification", "AML checks"]
});

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
