import { LegalPage } from "@/components/layout/legal-page";
import { privacySections } from "@/lib/legal-content";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      eyebrow="Privacy"
      summary="This Privacy Policy explains how PipNest Markets collects, uses, stores, shares, and protects personal information when users access the website and services."
      sections={privacySections}
    />
  );
}
