import { CmsPageView } from "@/components/cms/cms-page-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About PipNest Markets",
  description: "Discover PipNest Markets, a modern funded trader evaluation platform with simulated trading accounts, MT4/MT5-ready operations, and trader-focused tools.",
  path: "/about",
  keywords: ["about PipNest Markets", "funded trader platform", "simulated prop trading"]
});

export default function AboutPage() {
  return <CmsPageView slug="about" fallbackTitle="About PipNest Markets" />;
}
