import { LegalPage } from "@/components/layout/legal-page";
import { riskSections } from "@/lib/legal-content";

export default function RiskDisclosurePage() {
  return (
    <LegalPage
      title="Risk Disclosure"
      eyebrow="Risk"
      summary="Trading financial markets involves substantial risk. PipNest Markets accounts operate in a simulated environment for educational and evaluation purposes."
      sections={riskSections}
    />
  );
}
