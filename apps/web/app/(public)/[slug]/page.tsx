import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsSectionRenderer } from "@/components/cms/cms-section-renderer";
import { getCmsPage } from "@/lib/cms";

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getCmsPage(params.slug);
  if (!page) return {};
  const title = page.metaTitle || page.metadata?.ogTitle || page.title;
  const description = page.metaDescription || page.metadata?.ogDescription || page.content;

  return {
    title,
    description,
    keywords: [page.metadata?.shortKeywords, page.metadata?.longKeywords].filter(Boolean).join(", "),
    openGraph: {
      title: page.metadata?.ogTitle || title,
      description: page.metadata?.ogDescription || description,
      images: page.metadata?.ogImage ? [page.metadata.ogImage] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: page.metadata?.ogTitle || title,
      description: page.metadata?.ogDescription || description,
      images: page.metadata?.ogImage ? [page.metadata.ogImage] : undefined
    }
  };
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const page = await getCmsPage(params.slug);
  if (!page || page.published === false) notFound();
  const sections = page.sections?.filter((section) => section.published !== false && section.isVisible !== false) ?? [];

  return (
    <main>
      {sections.length ? (
        sections.map((section) => <CmsSectionRenderer key={section.sectionKey} section={section} />)
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">{page.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600 dark:text-slate-300">{page.content}</p>
        </section>
      )}
    </main>
  );
}
