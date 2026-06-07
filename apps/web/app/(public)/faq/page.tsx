import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Find answers to common PipNest Markets questions about funded trader challenges, rules, payments, payouts, accounts, and support.",
  path: "/faq",
  keywords: ["PipNest Markets FAQ", "funded trader questions", "prop firm help"]
});

export default function FAQPage() {
  return <CmsPageView slug="faq" fallbackTitle="FAQ" />;
}
