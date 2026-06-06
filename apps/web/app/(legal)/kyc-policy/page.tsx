import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { kycSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "KYC Policy",
  description: "Learn how PipNest Markets handles identity verification, KYC reviews, anti-money-laundering checks, account security, and payout verification.",
  path: "/kyc-policy",
  keywords: ["KYC policy", "identity verification", "AML checks"]
});

export default async function KycPolicyPage() {
  const page = await getCmsPage("kyc-policy");
  return (
    <LegalPage
      title={page?.title ?? "Risk Disclosure, AML/KYC Policy, Responsible Trading Policy"}
      eyebrow="Compliance"
      summary={page?.content ?? "This policy explains identity verification, AML controls, responsible trading expectations, trader responsibilities, and company review rights."}
      sections={cmsLegalSections(page, kycSections)}
    />
  );
}
