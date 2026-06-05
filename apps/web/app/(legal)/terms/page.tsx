import { LegalPage } from "@/components/layout/legal-page";
import { termsSections } from "@/lib/legal-content";

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
