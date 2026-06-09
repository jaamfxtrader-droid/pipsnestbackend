import { BadgeDollarSign, BarChart3, CheckCircle2, ShieldCheck, Target, Trophy, Users } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { AffiliateReferralPreview } from "@/components/marketing/affiliate-referral-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CmsPage, CmsSection } from "@/lib/cms";
import { parseAffiliatePageContent, type AffiliateIconName } from "@/lib/affiliate-page-content";
import { cn } from "@/lib/utils";

const affiliateIconMap: Record<AffiliateIconName, typeof BadgeDollarSign> = {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  Target,
  Trophy,
  Users
};

export function AffiliateMarketingPage({ page, intro, linkSection, preview = false }: { page?: CmsPage; intro?: CmsSection; linkSection?: CmsSection; preview?: boolean }) {
  const content = parseAffiliatePageContent(page?.metadata);
  const visibleMetrics = content.metrics.filter((item) => item.visible !== false);
  const visibleSteps = content.steps.filter((item) => item.visible !== false);
  const visibleBenefits = content.benefits.filter((item) => item.visible !== false);
  const visibleCtas = content.ctas.filter((item) => item.visible !== false && item.label && item.href);

  return (
    <main className="overflow-hidden bg-[#f7fbff] dark:bg-[#061126]">
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_82%_4%,rgba(14,165,233,0.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center">
            <div className="max-w-3xl">
              <Badge tone="primary">{intro?.eyebrow ?? "Affiliate Program"}</Badge>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal text-slate-950 dark:text-white sm:text-5xl">
                {intro?.title ?? page?.title ?? "Referral tracking and commission reporting are built in."}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                {intro?.content ?? page?.content}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {visibleCtas.map((cta) => (
                  <AuthAwareLink key={cta.id} href={cta.href} authenticatedHref={cta.href === "/dashboard/affiliate" ? "/dashboard/affiliate" : cta.href}>
                    <Button variant={cta.style === "secondary" ? "secondary" : "primary"}>{cta.label}</Button>
                  </AuthAwareLink>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.11)] dark:border-white/10 dark:bg-white/[0.05]">
              <div className="rounded-lg bg-[#061126] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-wide text-blue-200">{linkSection?.eyebrow ?? "Partner dashboard"}</p>
                <h2 className="mt-3 text-2xl font-black">{linkSection?.title ?? "Demo referral link"}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{linkSection?.content ?? "Control helper copy for the referral-link card from the CMS."}</p>
                <AffiliateReferralPreview preview={preview} />
              </div>
              <div className="mt-4 grid gap-3">
                {visibleMetrics.map((metric) => {
                  const Icon = affiliateIconMap[metric.icon] ?? BadgeDollarSign;
                  return (
                    <div key={metric.id} className="flex items-center gap-3 rounded-md bg-slate-50 p-3 dark:bg-white/[0.05]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-slate-950 dark:text-white">{metric.value} {metric.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{metric.helper}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {visibleSteps.map((step, index) => {
              const Icon = affiliateIconMap[step.icon] ?? Target;
              return (
                <article key={step.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-black text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.content}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {visibleBenefits.map((benefit) => {
              const Icon = affiliateIconMap[benefit.icon] ?? ShieldCheck;
              return (
                <article key={benefit.id} className={cn("rounded-lg border border-slate-200 p-5 dark:border-white/10", preview ? "bg-white dark:bg-white/[0.04]" : "bg-white/80 backdrop-blur dark:bg-white/[0.04]")}>
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{benefit.content}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
