import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How It Works",
  description: "Learn how to register, choose a PipNest Markets challenge, complete payment, track MT4/MT5-ready account progress, and request payouts.",
  path: "/how-it-works",
  keywords: ["how funded trading works", "prop firm process", "trader evaluation steps"]
});

export default function HowItWorksPage() {
  return <CmsPageView slug="how-it-works" fallbackTitle="How It Works" />;
}
