import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { privacySections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Read how PipNest Markets collects, uses, stores, shares, protects, and deletes personal information for website, mobile app, and trading platform services.",
  path: "/privacy",
  keywords: ["privacy policy", "data protection", "account deletion"]
});

export default async function PrivacyPage() {
  const page = await getCmsPage("privacy");
  return (
    <LegalPage
      title={page?.title ?? "Privacy Policy"}
      eyebrow="Privacy"
      summary={page?.content ?? "This Privacy Policy explains how PipNest Markets collects, uses, stores, shares, and protects personal information when users access the website and services."}
      sections={cmsLegalSections(page, privacySections)}
    />
  );
}
