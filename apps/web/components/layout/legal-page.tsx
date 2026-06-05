import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import type { LegalSection } from "@/lib/legal-content";

type LegalPageProps = {
  title: string;
  eyebrow?: string;
  summary?: string;
  sections?: LegalSection[];
  children?: ReactNode;
};

const trustCards = [
  ["Simulated environment", "All challenge terms are framed for evaluation-based accounts."],
  ["Policy protected", "Important restrictions are grouped into clear locked sections."],
  ["Trader responsibility", "Risk, verification, and conduct expectations stay visible."]
] as const;

export function LegalPage({ title, eyebrow = "Legal", summary, sections, children }: LegalPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">{title}</h1>
          {summary ? <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">{summary}</p> : null}
        </div>

        <div className="grid gap-3">
          {trustCards.map(([cardTitle, text]) => (
            <div key={cardTitle} className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-950 text-white dark:bg-primary">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{cardTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {sections?.map((section, index) => {
          const Icon = section.title.toLowerCase().includes("risk") ? AlertTriangle : index === 0 ? FileText : CheckCircle2;

          return (
            <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Section {String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{section.title}</h2>
                </div>
              </div>

              {section.body?.length ? (
                <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {section.bullets?.length ? (
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-profit" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>

      {children ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 leading-8 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
          {children}
        </div>
      ) : null}
    </main>
  );
}
