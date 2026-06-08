import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { accountDeletionSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Account Deletion",
  description: "Request deletion of your PipNest Markets account and associated personal data through the mobile app or by contacting support.",
  path: "/account-deletion",
  keywords: ["account deletion", "delete account", "personal data deletion"]
});

export default async function AccountDeletionPage() {
  const page = await getCmsPage("account-deletion");
  return (
    <LegalPage
      title={page?.title ?? "Account Deletion"}
      summary={page?.content ?? "How PipNest Markets users can request deletion of their account and associated personal data."}
      sections={cmsLegalSections(page, accountDeletionSections)}
    />
  );
}
