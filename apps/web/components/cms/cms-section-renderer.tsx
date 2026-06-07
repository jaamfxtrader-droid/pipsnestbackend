import Link from "next/link";
import { ArrowRight, Award, BadgeDollarSign, BarChart3, CheckCircle2, Crown, ShieldCheck, Star, Target, Trophy, Zap } from "lucide-react";
import type { CmsSection } from "@/lib/cms";
import { cn } from "@/lib/utils";

const iconMap = {
  Award,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Zap
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function richText(value: string, boldFontSize?: string) {
  let html = escapeHtml(value);
  html = html.replace(/\*\*(.*?)\*\*/g, `<strong style="${boldFontSize ? `font-size:${boldFontSize}` : ""}">$1</strong>`);
  html = html.replace(/~~(.*?)~~/g, "<s>$1</s>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="font-semibold text-primary underline underline-offset-4" href="$2">$1</a>');
  return html.replace(/\n/g, "<br />");
}

function ctaClass(style?: string) {
  if (style === "ghost") return "inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-black text-primary transition hover:bg-primary/10";
  if (style === "soft") return "inline-flex h-11 items-center gap-2 rounded-md bg-primary/10 px-5 text-sm font-black text-primary transition hover:bg-primary/15";
  return cn(
    "inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-black transition",
    style?.includes("outline")
      ? "border border-primary bg-transparent text-primary hover:bg-primary/10"
      : "bg-primary text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:bg-blue-600"
  );
}

function CmsLink({ cta }: { cta: Record<string, any> }) {
  if (!cta.label || !cta.href) return null;
  return (
    <Link href={cta.href} target={cta.target === "_blank" ? "_blank" : undefined} rel={cta.target === "_blank" ? "noreferrer" : undefined} className={ctaClass(cta.style)}>
      {cta.label}
      {cta.style?.includes("icon") ? <ArrowRight className="h-4 w-4" /> : null}
    </Link>
  );
}

export function CmsSectionRenderer({ section }: { section: CmsSection }) {
  if (section.published === false || section.isVisible === false) return null;

  const metadata = section.metadata ?? {};
  const images = (metadata.images as string[] | undefined) ?? [];
  const cards = (metadata.cards as Array<Record<string, any>> | undefined) ?? [];
  const lists = (metadata.lists as Array<Record<string, any>> | undefined) ?? [];
  const extraCtas = (metadata.ctas as Array<Record<string, any>> | undefined) ?? [];
  const legacyCtas: Array<Record<string, any>> =
    section.ctaLabel && section.ctaHref ? [{ label: section.ctaLabel, href: section.ctaHref, style: metadata.ctaStyle, target: metadata.ctaTarget }] : [];
  const ctas = extraCtas.length ? extraCtas : legacyCtas;
  const mediaFirst = section.position === 0 || section.position === 1;
  const split = section.sectionType === "flex" || section.sectionType === "split" || section.imageUrl || metadata.videoUrl;
  const backgroundMode = metadata.backgroundMode ?? "auto";
  const darkSection = section.colorScheme === "dark" || backgroundMode === "dark";
  const transparentSection = backgroundMode === "transparent";

  const contentStyles = {
    title: { fontSize: metadata.titleFontSize || undefined, color: metadata.titleColor || undefined },
    eyebrow: { fontSize: metadata.subtitleFontSize || undefined, color: metadata.subtitleColor || undefined },
    paragraph: { fontSize: metadata.paragraphFontSize || undefined, color: metadata.paragraphColor || undefined }
  };

  const media = (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.04]">
      {metadata.videoUrl ? (
        <video src={metadata.videoUrl} controls className="aspect-video h-full w-full bg-slate-950 object-cover" />
      ) : section.imageUrl ? (
        <img src={section.imageUrl} alt="" className="aspect-video h-full w-full object-cover" />
      ) : null}
    </div>
  );

  const content = (
    <div>
      {section.eyebrow ? (
        <p className="text-sm font-black uppercase tracking-wide text-primary" style={contentStyles.eyebrow}>
          {section.eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950 dark:text-white sm:text-4xl" style={contentStyles.title}>
        {section.title}
      </h2>
      <p
        className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600 dark:text-slate-300"
        style={contentStyles.paragraph}
        dangerouslySetInnerHTML={{ __html: richText(section.content, metadata.boldFontSize) }}
      />
      {ctas.length ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {ctas.slice(0, 3).map((cta, index) => (
            <CmsLink key={cta.id ?? index} cta={cta} />
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      className={cn(
        "mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8",
        !transparentSection && backgroundMode === "light" && "bg-white",
        darkSection && "bg-[#061126] text-white"
      )}
    >
      {split ? (
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {mediaFirst ? media : content}
          {mediaFirst ? content : media}
        </div>
      ) : (
        <div className={cn(section.sectionType === "grid" ? "grid gap-6 md:grid-cols-2" : "max-w-3xl")}>{content}</div>
      )}

      {images.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {images.slice(0, 5).map((image, index) => (
            <img key={`${image.slice(0, 18)}-${index}`} src={image} alt="" className="aspect-video w-full rounded-lg border border-slate-200 object-cover dark:border-white/10" />
          ))}
        </div>
      ) : null}

      {lists.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {lists.map((list, index) => {
            const items = (Array.isArray(list.items) ? list.items : []) as string[];
            const ordered = list.type === "number";
            return (
              <div key={list.id ?? index} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                {list.title ? <h3 className="text-lg font-black text-slate-950 dark:text-white">{list.title}</h3> : null}
                {ordered ? (
                  <ol className="mt-4 grid list-decimal gap-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                  </ol>
                ) : (
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {items.map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`} className="flex gap-2">
                        <span className="mt-1 text-primary">{list.type === "check" ? "✓" : "•"}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {cards.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.slice(0, 10).map((card, index) => {
            const Icon = iconMap[card.icon as keyof typeof iconMap] ?? Star;
            const cardCtas = (card.ctas as Array<Record<string, any>> | undefined) ?? [];
            return (
              <article key={card.id ?? index} className="rounded-lg border border-slate-200 p-5 shadow-sm dark:border-white/10" style={{ backgroundColor: metadata.cardBackgroundColor || undefined }}>
                <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.content}</p>
                {typeof card.listItems === "string" && card.listItems.trim() ? (
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {card.listItems.split("\n").filter(Boolean).map((item: string, itemIndex: number) => (
                      <li key={`${item}-${itemIndex}`} className="flex gap-2">
                        <span className="mt-1 text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {cardCtas.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {cardCtas.slice(0, 2).map((cta, ctaIndex) => (
                      <CmsLink key={cta.id ?? ctaIndex} cta={cta} />
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
