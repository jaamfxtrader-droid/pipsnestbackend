import { HowItWorksMarketingPage } from "@/components/marketing/how-it-works-marketing-page";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How It Works",
  description: "Learn how to register, choose a PipNest Markets challenge, complete payment, track MT4/MT5-ready account progress, and request payouts.",
  path: "/how-it-works",
  keywords: ["how funded trading works", "prop firm process", "trader evaluation steps"]
});

export default async function HowItWorksPage() {
  const page = await getCmsPage("how-it-works");
  const intro = getCmsSection(page, "intro");
  const steps = getCmsSection(page, "steps");

  return <HowItWorksMarketingPage page={page} intro={intro} stepsSection={steps} />;
}
