import { LegalPage } from "@/components/layout/legal-page";
import { disclaimerSections } from "@/lib/legal-content";

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
