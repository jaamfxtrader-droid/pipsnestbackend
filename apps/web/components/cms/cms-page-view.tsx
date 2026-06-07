import { PublicContactForm } from "@/components/forms/public-contact-form";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { CmsSectionRenderer } from "./cms-section-renderer";

export async function CmsPageView({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const page = await getCmsPage(slug);
  const sections = page?.sections?.filter((section) => section.published !== false && section.isVisible !== false) ?? [];
  const formSection = slug === "contact" ? getCmsSection(page, "form") : undefined;

  return (
    <main>
      {sections.length ? (
        sections.map((section) => <CmsSectionRenderer key={section.sectionKey} section={section} />)
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">{page?.title ?? fallbackTitle}</h1>
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600 dark:text-slate-300">{page?.content}</p>
        </section>
      )}
      {slug === "contact" ? (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <PublicContactForm title={formSection?.title} content={formSection?.content} />
        </section>
      ) : null}
    </main>
  );
}
