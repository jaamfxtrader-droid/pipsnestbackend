import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CmsSection } from "@/lib/cms";
import { cn } from "@/lib/utils";

function ctaClass(style?: string) {
  return cn(
    "inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-black transition",
    style?.includes("outline")
      ? "border border-primary text-primary hover:bg-primary/10"
      : "bg-primary text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:bg-blue-600"
  );
}

export function CmsSectionRenderer({ section }: { section: CmsSection }) {
  if (section.published === false || section.isVisible === false) return null;

  const mediaFirst = section.position === 0 || section.position === 1;
  const split = section.sectionType === "flex" || section.sectionType === "split" || section.imageUrl || section.metadata?.videoUrl;
  const media = (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.04]">
      {section.metadata?.videoUrl ? (
        <video src={section.metadata.videoUrl} controls className="aspect-video h-full w-full bg-slate-950 object-cover" />
      ) : section.imageUrl ? (
        <img src={section.imageUrl} alt="" className="aspect-video h-full w-full object-cover" />
      ) : null}
    </div>
  );

  const content = (
    <div>
      {section.eyebrow ? <p className="text-sm font-black uppercase tracking-wide text-primary">{section.eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950 dark:text-white sm:text-4xl">{section.title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600 dark:text-slate-300">{section.content}</p>
      {section.ctaLabel && section.ctaHref ? (
        <Link
          href={section.ctaHref}
          target={section.metadata?.ctaTarget === "_blank" ? "_blank" : undefined}
          rel={section.metadata?.ctaTarget === "_blank" ? "noreferrer" : undefined}
          className={cn("mt-6", ctaClass(section.metadata?.ctaStyle))}
        >
          {section.ctaLabel}
          {section.metadata?.ctaStyle?.includes("icon") ? <ArrowRight className="h-4 w-4" /> : null}
        </Link>
      ) : null}
    </div>
  );

  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8", section.colorScheme === "dark" && "bg-[#061126] text-white")}>
      {split ? (
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {mediaFirst ? media : content}
          {mediaFirst ? content : media}
        </div>
      ) : (
        <div className={cn(section.sectionType === "grid" ? "grid gap-6 md:grid-cols-2" : "max-w-3xl")}>{content}</div>
      )}
    </section>
  );
}
