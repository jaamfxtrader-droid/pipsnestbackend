import { LegalPage, cmsLegalSections } from "@/components/layout/legal-page";
import { getCmsPage } from "@/lib/cms";
import { aboutSections } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About PipNest Markets",
  description: "Discover PipNest Markets, a modern funded trader evaluation platform with simulated trading accounts, MT4/MT5-ready operations, and trader-focused tools.",
  path: "/about",
  keywords: ["about PipNest Markets", "funded trader platform", "simulated prop trading"]
});

export default async function AboutPage() {
  const page = await getCmsPage("about");
  return (
    <LegalPage
      title={page?.title ?? "About PipNest Markets"}
      eyebrow="About"
      summary={page?.content ?? "Discover PipNest Markets, a modern funded trader evaluation platform with simulated trading accounts, MT4/MT5-ready operations, and trader-focused tools."}
      sections={cmsLegalSections(page, aboutSections)}
    />
  );
}
