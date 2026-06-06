import { LegalPage } from "@/components/layout/legal-page";
import { disclaimerSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Disclaimer",
  description: "Read PipNest Markets disclaimers about simulated trading accounts, service fees, no investment advice, and financial-market risk.",
  path: "/disclaimer",
  keywords: ["trading disclaimer", "no investment advice", "simulated trading"]
});

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      eyebrow="Disclosure"
      summary="This disclaimer explains the simulated trading setup, service-fee structure, absence of investment services, and general risk warnings for PipNest Markets programs."
      sections={disclaimerSections}
    />
  );
}
