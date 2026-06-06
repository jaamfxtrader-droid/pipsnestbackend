import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { disclaimerSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Disclaimer",
  description: "Read PipNest Markets disclaimers about simulated trading accounts, service fees, no investment advice, and financial-market risk.",
  path: "/disclaimer",
  keywords: ["trading disclaimer", "no investment advice", "simulated trading"]
});

export default async function DisclaimerPage() {
  const page = await getCmsPage("disclaimer");
  return (
    <LegalPage
      title={page?.title ?? "Disclaimer"}
      eyebrow="Disclosure"
      summary={page?.content ?? "This disclaimer explains the simulated trading setup, service-fee structure, absence of investment services, and general risk warnings for PipNest Markets programs."}
      sections={cmsLegalSections(page, disclaimerSections)}
    />
  );
}
