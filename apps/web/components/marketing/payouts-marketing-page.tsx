import { BadgeDollarSign, BarChart3, CheckCircle2, Clock3, DollarSign, ShieldCheck, Target } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CmsPage, CmsSection } from "@/lib/cms";
import { parsePayoutsPageContent, type PayoutIconName } from "@/lib/payouts-page-content";

const payoutIconMap: Record<PayoutIconName, typeof BadgeDollarSign> = {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  ShieldCheck,
  Target
};

export function PayoutsMarketingPage({ page, intro, workflowSection }: { page?: CmsPage; intro?: CmsSection; workflowSection?: CmsSection }) {
  const content = parsePayoutsPageContent(page?.metadata);
  const metrics = content.metrics.filter((item) => item.visible !== false);
  const workflow = content.workflow.filter((item) => item.visible !== false);
  const methods = content.methods.filter((item) => item.visible !== false);
  const trustCards = content.trustCards.filter((item) => item.visible !== false);
  const ctas = content.ctas.filter((item) => item.visible !== false && item.label && item.href);

  return (
    <main className="overflow-hidden bg-[#f7fbff] dark:bg-[#061126]">
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_24%_10%,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.13),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-center">
            <div className="max-w-3xl">
              <Badge tone="primary">{intro?.eyebrow ?? "Payouts"}</Badge>
              <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">
                {intro?.title ?? page?.title ?? "Request, review, approve, and track payouts."}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{intro?.content ?? page?.content}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {ctas.map((cta) => (
                  <AuthAwareLink key={cta.id} href={cta.href} authenticatedHref={cta.href === "/dashboard/payouts" ? "/dashboard/payouts" : cta.href}>
                    <Button variant={cta.style === "secondary" ? "secondary" : "primary"}>{cta.label}</Button>
                  </AuthAwareLink>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.11)] dark:border-white/10 dark:bg-white/[0.05]">
              <div className="rounded-lg bg-[#061126] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-wide text-blue-200">Payout ledger</p>
                <h2 className="mt-3 text-2xl font-black">Status from request to release</h2>
                <div className="mt-5 grid gap-3">
                  {["Pending review", "Approved", "Paid"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-md bg-white/10 p-3">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-xs font-black text-white">0{index + 1}</span>
                      <span className="text-sm font-black">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {metrics.map((metric) => {
                  const Icon = payoutIconMap[metric.icon] ?? BadgeDollarSign;
                  return (
                    <div key={metric.id} className="flex items-center gap-3 rounded-md bg-slate-50 p-3 dark:bg-white/[0.05]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-slate-950 dark:text-white">{metric.value} {metric.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{metric.helper}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-14 max-w-3xl">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">{workflowSection?.title ?? "A clean payout review workflow"}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{workflowSection?.content ?? "Explain payout submission, review, approval, and paid states from the CMS."}</p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((step, index) => {
              const Icon = payoutIconMap[step.icon] ?? Target;
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
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Supported payout paths</h3>
              <div className="mt-5 grid gap-3">
                {methods.map((method) => {
                  const Icon = payoutIconMap[method.icon] ?? DollarSign;
                  return (
                    <div key={method.id} className="flex gap-3 rounded-md bg-slate-50 p-4 dark:bg-white/[0.05]">
                      <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h4 className="font-black text-slate-950 dark:text-white">{method.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{method.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-5">
              {trustCards.map((card) => {
                const Icon = payoutIconMap[card.icon] ?? ShieldCheck;
                return (
                  <article key={card.id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.content}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
