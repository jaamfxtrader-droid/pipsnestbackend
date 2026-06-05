import { Copy, Megaphone, Users } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { Button } from "@/components/ui/button";
import { getCmsPage, getCmsSection } from "@/lib/cms";

export default async function AffiliatePage() {
  const page = await getCmsPage("affiliate");
  const intro = getCmsSection(page, "intro");
  const linkSection = getCmsSection(page, "link");

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="font-semibold text-primary">{intro?.eyebrow ?? "Affiliate Program"}</p>
          <h1 className="mt-3 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
          <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
            {intro?.content ?? page?.content}
          </p>
          <AuthAwareLink href={intro?.ctaHref ?? "/auth/register"} authenticatedHref="/dashboard/affiliate">
            <Button className="mt-8"><Megaphone className="h-4 w-4" /> {intro?.ctaLabel ?? "Become an Affiliate"}</Button>
          </AuthAwareLink>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{linkSection?.title ?? "Demo referral link"}</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{linkSection?.content}</p>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-white/10">
            <span className="truncate">pipnestfunding.com/auth/register?ref=YOURCODE</span>
            <Copy className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>
    </main>
  );
}
