import { BadgeDollarSign, BarChart3, CheckCircle2, DollarSign, ShieldCheck, Target, Trophy } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { ChallengeProgramGrid } from "@/components/marketing/challenge-program-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { parseFundingPageContent, type FundingIconName } from "@/lib/funding-page-content";
import { pageMetadata } from "@/lib/seo";

const fundingIconMap: Record<FundingIconName, typeof Trophy> = {
  Trophy,
  BadgeDollarSign,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Target,
  DollarSign
};

export const metadata = pageMetadata({
  title: "Funding Programs",
  description: "Compare PipNest Markets funded trader challenge account sizes, rules, profit targets, drawdown limits, and MT4/MT5-ready workflows.",
  path: "/funding-programs",
  keywords: ["funding programs", "challenge account sizes", "prop firm pricing"]
});

export default async function FundingProgramsPage() {
  const page = await getCmsPage("funding-programs");
  const intro = getCmsSection(page, "intro");
  const fundingContent = parseFundingPageContent(page?.metadata);

  return (
    <main className="overflow-hidden">
      <section className="relative bg-[#f4fbff] px-4 py-16 dark:bg-[#061126] sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_22%_12%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(34,211,238,0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <Badge tone="primary">{intro?.eyebrow ?? "Funding Programs"}</Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#061126] sm:text-5xl dark:text-white">{intro?.title ?? page?.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{intro?.content ?? page?.content}</p>
            </div>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] sm:grid-cols-3 lg:w-[31rem]">
              {fundingContent.heroStats.filter((item) => item.visible !== false).map((item) => {
                const Icon = fundingIconMap[item.icon] ?? Trophy;
                return (
                <div key={item.id} className="rounded-md bg-slate-50 p-3 dark:bg-white/[0.05]">
                  <Icon className="h-4 w-4 text-primary" />
                  <strong className="mt-3 block text-xl text-[#061126] dark:text-white">{item.value}</strong>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                </div>
                );
              })}
            </div>
          </div>

          <ChallengeProgramGrid featureItems={fundingContent.featureItems} />

          <div className="mt-8 flex flex-wrap gap-3">
            {fundingContent.ctas.filter((cta) => cta.visible !== false && cta.label && cta.href).map((cta) => {
              const Icon = cta.icon ? fundingIconMap[cta.icon] : null;
              return (
                <AuthAwareLink key={cta.id} href={cta.href} authenticatedHref={cta.href === "/auth/register" ? "/dashboard" : cta.href}>
                  <Button variant={cta.style === "secondary" ? "secondary" : "primary"}>
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {cta.label}
                  </Button>
                </AuthAwareLink>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
