import { getCmsPage, getCmsSection } from "@/lib/cms";

const steps = [
  ["Register", "Create a trader account with secure bcrypt-backed authentication on the API."],
  ["Purchase", "Create an order, apply a coupon, and start the placeholder payment flow."],
  ["Trade", "Use dummy MT4/MT5 data while tracking profit target and drawdown rules."],
  ["Scale", "Request payouts and grow affiliate referrals through the dashboard."]
];

export default async function HowItWorksPage() {
  const page = await getCmsPage("how-it-works");
  const intro = getCmsSection(page, "intro");
  const stepsSection = getCmsSection(page, "steps");

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-primary">{intro?.eyebrow ?? "How It Works"}</p>
      <h1 className="mt-3 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
      <p className="mt-5 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">{intro?.content ?? page?.content}</p>
      <div className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-semibold">{stepsSection?.title}</h2>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{stepsSection?.content}</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {steps.map(([title, text], index) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">{index + 1}</span>
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
