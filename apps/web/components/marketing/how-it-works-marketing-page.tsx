import { BadgeDollarSign, BarChart3, CheckCircle2, Clock3, ShieldCheck, Target, Trophy } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CmsPage, CmsSection } from "@/lib/cms";
import { parseHowItWorksPageContent, type HowIconName } from "@/lib/how-it-works-page-content";

const howIconMap: Record<HowIconName, typeof Target> = {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Target,
  Trophy
};

export function HowItWorksMarketingPage({ page, intro, stepsSection }: { page?: CmsPage; intro?: CmsSection; stepsSection?: CmsSection }) {
  const content = parseHowItWorksPageContent(page?.metadata);
  const metrics = content.metrics.filter((item) => item.visible !== false);
  const steps = content.steps.filter((item) => item.visible !== false);
  const ctas = content.ctas.filter((item) => item.visible !== false && item.label && item.href);

  return (
    <main className="overflow-hidden bg-[#f7fbff] dark:bg-[#061126]">
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_20%_8%,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center">
            <div className="max-w-3xl">
              <Badge tone="primary">{intro?.eyebrow ?? "How It Works"}</Badge>
              <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">
                {intro?.title ?? page?.title ?? "A complete funding workflow from account to payout."}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{intro?.content ?? page?.content}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {ctas.map((cta) => (
                  <AuthAwareLink key={cta.id} href={cta.href} authenticatedHref={cta.href === "/funding-programs" ? "/funding-programs" : cta.href}>
                    <Button variant={cta.style === "secondary" ? "secondary" : "primary"}>{cta.label}</Button>
                  </AuthAwareLink>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.11)] dark:border-white/10 dark:bg-white/[0.05]">
              <div className="rounded-lg bg-[#061126] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-wide text-blue-200">Trader journey</p>
                <h2 className="mt-3 text-2xl font-black">From signup to payout readiness</h2>
                <div className="mt-5 grid gap-3">
                  {steps.slice(0, 4).map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 rounded-md bg-white/10 p-3">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-xs font-black text-white">0{index + 1}</span>
                      <span className="min-w-0 truncate text-sm font-black">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {metrics.map((metric) => {
                  const Icon = howIconMap[metric.icon] ?? Target;
                  return (
                    <div key={metric.id} className="flex items-center gap-3 rounded-md bg-slate-50 p-3 dark:bg-white/[0.05]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-950 dark:text-white">{metric.value}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{metric.label}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-14 max-w-3xl">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">{stepsSection?.title ?? "Four clear steps from signup to scale"}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{stepsSection?.content ?? "Edit the heading and supporting copy around the operational steps from the CMS."}</p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = howIconMap[step.icon] ?? Target;
              return (
                <article key={step.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-black text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.content}</p>
                  <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">{step.helper}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
