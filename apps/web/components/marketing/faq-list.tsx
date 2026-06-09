import { ChevronDown, HelpCircle } from "lucide-react";
import type { CmsFaqItem } from "@/lib/faq-page-content";

export function FaqList({ items, compact = false }: { items: CmsFaqItem[]; compact?: boolean }) {
  const visibleItems = items.filter((item) => item.visible !== false && item.question.trim());

  return (
    <div className="grid gap-3">
      {visibleItems.map((item, index) => (
        <details
          key={item.id}
          className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_55px_rgba(15,23,42,0.09)] open:border-primary/35 open:shadow-[0_22px_70px_rgba(37,99,235,0.12)] dark:border-white/10 dark:bg-[#0d1a31] dark:hover:border-primary/40"
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-black text-slate-500 transition group-open:bg-primary group-open:text-white dark:bg-white/[0.06] dark:text-slate-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-base font-black leading-6 text-slate-950 dark:text-white">{item.question}</span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition group-open:rotate-180 group-open:bg-primary group-open:text-white">
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">
            <div className="space-y-4 pl-0 sm:pl-12">
            {item.answer
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, paragraphIndex) => (
                <p key={`${item.id}-p-${paragraphIndex}`}>{paragraph}</p>
              ))}
            {item.bullets.length ? (
              <ul className="grid gap-2 rounded-md bg-slate-50 p-4 dark:bg-white/[0.04]">
                {item.bullets.map((bullet, bulletIndex) => (
                  <li key={`${item.id}-b-${bulletIndex}`} className="flex gap-2">
                    <HelpCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            </div>
          </div>
        </details>
      ))}
      {!visibleItems.length && !compact ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
          FAQ questions will appear here after they are added in the CMS.
        </div>
      ) : null}
    </div>
  );
}
