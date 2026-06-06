import { LegalPage } from "@/components/layout/legal-page";
import { termsSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Review PipNest Markets terms for account access, funded trader challenges, simulated evaluation rules, prohibited practices, and platform responsibilities.",
  path: "/terms",
  keywords: ["terms and conditions", "challenge terms", "trader responsibilities"]
});

export default function TermsPage() {
  return (
    <LegalPage
      title="PipNest Markets - Terms & Conditions"
      eyebrow="Legal"
      summary="These Terms & Conditions govern access to PipNest Markets services, challenge accounts, simulated evaluation rules, prohibited practices, and account responsibilities."
      sections={termsSections}
    />
  );
}
