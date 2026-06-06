import { LegalPage } from "@/components/layout/legal-page";
import { riskSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Risk Disclosure",
  description: "Understand PipNest Markets risk disclosures for simulated trading, financial-market risk, evaluation performance, and trader responsibility.",
  path: "/risk-disclosure",
  keywords: ["risk disclosure", "simulated trading risk", "forex risk"]
});

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
