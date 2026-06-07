import Link from "next/link";
import { ArrowRight, BadgeDollarSign, BarChart3, CheckCircle2, Crown, ShieldCheck, Target, Trophy, Zap } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { fundingPrograms } from "@/lib/mock-data";
import { pageMetadata } from "@/lib/seo";
import { cn, currency } from "@/lib/utils";

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
                ["Routes", `${fundingPrograms.length}`, Trophy],
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

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {fundingPrograms.map((program, index) => {
              const featured = Boolean(program.featured);
              const rewardEstimate = program.accountSize * 0.08 * 0.8;

              return (
                <article
                  key={program.id}
                  className={cn(
                    "relative flex min-h-full flex-col overflow-hidden rounded-lg border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(37,99,235,0.16)]",
                    featured
                      ? "border-primary bg-[#082f73] text-white shadow-[0_24px_80px_rgba(37,99,235,0.28)]"
                      : "border-slate-200 bg-white text-[#061126] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  )}
                >
                  <div className="absolute right-4 top-4 text-7xl font-black opacity-[0.06]">0{index + 1}</div>
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <Badge tone={featured ? "profit" : "primary"}>{featured ? "Popular route" : program.phase}</Badge>
                      <h2 className="mt-4 text-3xl font-black">{currency(program.accountSize)}</h2>
                      <p className={cn("mt-1 text-sm font-semibold", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>{program.name} Challenge</p>
                    </div>
                    <span className={cn("grid h-12 w-12 place-items-center rounded-lg", featured ? "bg-white/12 text-warning" : "bg-primary/10 text-primary")}>
                      {featured ? <Crown className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                    </span>
                  </div>

                  <div className={cn("mt-6 rounded-lg border p-4", featured ? "border-white/12 bg-white/[0.06]" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]")}>
                    <div className="flex items-end justify-between gap-3">
                      <span>
                        <span className={cn("block text-xs font-black uppercase", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>Challenge fee</span>
                        <strong className="mt-1 block text-3xl">{currency(program.price)}</strong>
                      </span>
                      <span className={cn("rounded-md px-3 py-2 text-xs font-black", featured ? "bg-white/12 text-white" : "bg-white text-primary dark:bg-slate-950/50")}>{program.leverage}</span>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs font-semibold">
                        <span>Target path</span>
                        <span>{program.profitTarget}%</span>
                      </div>
                      <ProgressBar value={Math.min(92, program.profitTarget * 8)} className={featured ? "bg-white/10" : undefined} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm">
                    {[
                      [ShieldCheck, "Profit target", `${program.profitTarget}%`],
                      [Zap, "Daily drawdown", `${program.dailyDrawdown}%`],
                      [BarChart3, "Max drawdown", `${program.maxDrawdown}%`],
                      [CheckCircle2, "Minimum days", `${program.minDays}`]
                    ].map(([Icon, label, value]) => (
                      <div key={label as string} className={cn("flex items-center justify-between gap-3 rounded-md px-3 py-2", featured ? "bg-white/[0.06]" : "bg-slate-50 dark:bg-white/[0.04]")}>
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon className={cn("h-4 w-4 shrink-0", featured ? "text-blue-200" : "text-primary")} />
                          <span className={cn("truncate", featured ? "text-blue-100" : "text-slate-600 dark:text-slate-300")}>{label as string}</span>
                        </span>
                        <strong>{value as string}</strong>
                      </div>
                    ))}
                  </div>

                  <p className={cn("mt-auto pt-5 text-center text-sm", featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                    Estimated first reward <strong className={featured ? "text-white" : "text-[#061126] dark:text-white"}>{currency(rewardEstimate)}</strong>
                  </p>

                  <AuthAwareLink href="/auth/login" authenticatedHref="/dashboard/purchase">
                    <Button className={cn("mt-5 w-full rounded-md", featured ? "bg-white text-primary hover:bg-blue-50" : "")}>
                      Choose Plan <ArrowRight className="h-4 w-4" />
                    </Button>
                  </AuthAwareLink>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-3">
            {["Clear evaluation rules", "MT4/MT5-ready workflow", "Dashboard purchase tracking"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {item}
              </div>
            ))}
          </div>

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
