import { CmsSectionRenderer } from "@/components/cms/cms-section-renderer";
import { FaqList } from "@/components/marketing/faq-list";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { parseFaqItems } from "@/lib/faq-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Find answers to common PipNest Markets questions about funded trader challenges, rules, payments, payouts, accounts, and support.",
  path: "/faq",
  keywords: ["PipNest Markets FAQ", "funded trader questions", "prop firm help"]
});

export default async function FAQPage() {
  const page = await getCmsPage("faq");
  const intro = getCmsSection(page, "intro");
  const questions = getCmsSection(page, "questions");
  const faqItems = parseFaqItems(page?.metadata);
  const visibleCount = faqItems.filter((item) => item.visible !== false && item.question.trim()).length;

  return (
    <main className="bg-[#f7fbff] dark:bg-[#061126]">
      {intro ? <CmsSectionRenderer section={intro} /> : null}
      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[21rem_minmax(0,1fr)] lg:px-8">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <span className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">FAQ</span>
            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 dark:text-white">{questions?.title ?? "Frequently asked questions"}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{questions?.content ?? page?.content}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-50 p-4 dark:bg-white/[0.05]">
                <strong className="block text-2xl font-black text-slate-950 dark:text-white">{visibleCount}</strong>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Answers</span>
              </div>
              <div className="rounded-md bg-slate-50 p-4 dark:bg-white/[0.05]">
                <strong className="block text-2xl font-black text-slate-950 dark:text-white">24/7</strong>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Support</span>
              </div>
            </div>
          </div>
        </div>
        <FaqList items={faqItems} />
      </section>
    </main>
  );
}
