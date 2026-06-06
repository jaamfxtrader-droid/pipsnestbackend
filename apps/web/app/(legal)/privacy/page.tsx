import { LegalPage } from "@/components/layout/legal-page";
import { privacySections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Read how PipNest Markets collects, uses, stores, shares, protects, and deletes personal information for website, mobile app, and trading platform services.",
  path: "/privacy",
  keywords: ["privacy policy", "data protection", "account deletion"]
});

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
