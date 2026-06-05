import { CheckCircle2, Clock, Wallet } from "lucide-react";
import { PayoutCard } from "@/components/dashboard/payout-card";
import { getCmsPage, getCmsSection } from "@/lib/cms";

export default async function PayoutsPage() {
  const page = await getCmsPage("payouts");
  const intro = getCmsSection(page, "intro");
  const workflow = getCmsSection(page, "workflow");

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <p className="font-semibold text-primary">{intro?.eyebrow ?? "Payouts"}</p>
        <h1 className="mt-3 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
        <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">{intro?.content ?? page?.content}</p>
        <h2 className="mt-10 text-2xl font-semibold">{workflow?.title}</h2>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{workflow?.content}</p>
        <div className="mt-10 grid gap-4">
          {[
            { title: "Trader submits request", icon: Wallet },
            { title: "Admin reviews account status", icon: Clock },
            { title: "Payout marked approved or paid", icon: CheckCircle2 }
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <item.icon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
      <PayoutCard />
    </main>
  );
}
