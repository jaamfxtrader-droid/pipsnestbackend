import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Contact PipNest Markets support for funded trader challenge questions, account help, payouts, KYC, billing, and platform assistance.",
  path: "/contact",
  keywords: ["PipNest Markets contact", "trader support", "prop firm support"]
});

export default function ContactPage() {
  return <CmsPageView slug="contact" fallbackTitle="Contact" />;
}
