import { ShieldCheck, Target, Users } from "lucide-react";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About PipNest Markets",
  description: "Discover PipNest Markets, a modern funded trader evaluation platform with simulated trading accounts, MT4/MT5-ready operations, and trader-focused tools.",
  path: "/about",
  keywords: ["about PipNest Markets", "funded trader platform", "simulated prop trading"]
});

export default async function AboutPage() {
  const page = await getCmsPage("about");
  const intro = getCmsSection(page, "intro");
  const features = getCmsSection(page, "features");

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="font-semibold text-primary">{intro?.eyebrow ?? "About Us"}</p>
        <h1 className="mt-3 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
        <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
          {intro?.content ?? page?.content}
        </p>
      </div>
      <div className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-semibold">{features?.title}</h2>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{features?.content}</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          { title: "Transparent Rules", icon: ShieldCheck, text: "Profit targets, drawdown limits, and account status are visible inside the dashboard." },
          { title: "Operational Control", icon: Users, text: "Admins can manage users, orders, payments, payouts, tickets, coupons, and CMS pages." },
          { title: "Integration Ready", icon: Target, text: "MT4/MT5 logic is isolated inside service files for a clean Manager API connection later." }
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <item.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
