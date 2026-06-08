import Link from "next/link";
import { BadgeDollarSign, BarChart3, Trophy } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { ChallengeProgramGrid } from "@/components/marketing/challenge-program-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Funding Programs",
  description: "Compare PipNest Markets funded trader challenge account sizes, rules, profit targets, drawdown limits, and MT4/MT5-ready workflows.",
  path: "/funding-programs",
  keywords: ["funding programs", "challenge account sizes", "prop firm pricing"]
});

export default async function FundingProgramsPage() {
  const page = await getCmsPage("funding-programs");
  const intro = getCmsSection(page, "intro");

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
              {[ 
                ["Routes", "Live", Trophy],
                ["Split", "80%", BadgeDollarSign],
                ["Leverage", "1:100", BarChart3]
              ].map(([label, value, Icon]) => (
                <div key={label as string} className="rounded-md bg-slate-50 p-3 dark:bg-white/[0.05]">
                  <Icon className="h-4 w-4 text-primary" />
                  <strong className="mt-3 block text-xl text-[#061126] dark:text-white">{value as string}</strong>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          <ChallengeProgramGrid />

          <div className="mt-8 flex flex-wrap gap-3">
            <AuthAwareLink href="/auth/register" authenticatedHref="/dashboard">
              <Button>Start now</Button>
            </AuthAwareLink>
            <Link href="/challenge-details">
              <Button variant="secondary">View rules</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
