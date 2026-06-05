import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";
import { faqItems } from "@/lib/legal-content";

export default function FAQPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">Frequently Asked Questions</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Answers for funding accounts, challenge rules, drawdown limits, payouts, strategy restrictions, scaling, and support.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">Evaluation-first answers</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Every answer keeps risk rules, simulated accounts, and trader responsibility visible.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-4">
        {faqItems.map((item, index) => (
          <details key={item.question} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/[0.035]">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <span className="flex min-w-0 gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-semibold text-white dark:bg-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="pt-1 text-base font-semibold text-slate-950 dark:text-white">{item.question}</span>
              </span>
              <ChevronDown className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>

            <div className="ml-0 mt-5 grid gap-3 border-t border-slate-100 pt-5 text-sm leading-7 text-slate-600 sm:ml-[3.25rem] dark:border-white/10 dark:text-slate-300">
              {item.answer?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {item.bullets?.length ? (
                <ul className="grid gap-2">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-profit" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
