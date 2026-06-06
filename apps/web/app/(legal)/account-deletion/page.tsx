import { LegalPage } from "@/components/layout/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Account Deletion",
  description: "Request deletion of your PipNest Markets account and associated personal data through the mobile app or by contacting support.",
  path: "/account-deletion",
  keywords: ["account deletion", "delete account", "personal data deletion"]
});

const sections = [
  {
    title: "How to request deletion",
    body: [
      "You can request deletion of your PipNest Markets account from inside the mobile app by opening Profile, then Account deletion, then Request account deletion.",
      "You can also email contact@pipnestmarkets.com from the email address registered on your account with the subject Account deletion request."
    ]
  },
  {
    title: "What happens next",
    body: [
      "Our support team verifies the request, reviews any open orders, payouts, disputes, security flags, or legal obligations, and then processes eligible account and personal data deletion.",
      "Some records may be retained where required for fraud prevention, security, accounting, dispute resolution, legal, or regulatory compliance."
    ]
  },
  {
    title: "Contact",
    body: [
      "For deletion questions, contact PipNest Markets at contact@pipnestmarkets.com."
    ]
  }
];

export default function AccountDeletionPage() {
  return (
    <LegalPage
      title="Account Deletion"
      summary="How PipNest Markets users can request deletion of their account and associated personal data."
      sections={sections}
    />
  );
}
