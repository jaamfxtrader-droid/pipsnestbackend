"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

type RichTextRendererProps = {
  value: string;
  className?: string;
};

type Preview = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
};

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; style: "decimal" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman"; items: string[] };

const listPattern = /^(\s*)([-*]|\d+[.)]|[a-z]\.|[A-Z]\.|[ivxlcdm]+\)|[IVXLCDM]+\))\s+(.+)$/;

function isHtml(value: string) {
  return /<(?:p|div|ul|ol|li|strong|b|em|i|u|s|a|details|summary|br)\b/i.test(value);
}

function decodeHtml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function normalizeRichText(value: string) {
  let normalized = value.trim();
  for (let index = 0; index < 2; index += 1) {
    const decoded = decodeHtml(normalized);
    if (decoded === normalized) break;
    normalized = decoded;
  }
  return normalized.replace(/<br\s*\/?>/gi, "<br>");
}

function safeHref(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return "#";
  if (/^(javascript|data):/i.test(trimmed)) return "#";
  return trimmed;
}

function orderedStyle(marker: string): "decimal" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman" {
  if (/^\d+[.)]$/.test(marker)) return "decimal";
  if (/^[a-z]\.$/.test(marker)) return "lower-alpha";
  if (/^[A-Z]\.$/.test(marker)) return "upper-alpha";
  if (/^[ivxlcdm]+\)$/.test(marker)) return "lower-roman";
  return "upper-roman";
}

function parseBlocks(value: string) {
  const blocks: Block[] = [];
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: Block | null = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: "p", text: paragraph.join("\n") });
    paragraph = [];
  }

  function flushList() {
    if (list) blocks.push(list);
    list = null;
  }

  lines.forEach((line) => {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }
    const match = line.match(listPattern);
    if (!match) {
      flushList();
      paragraph.push(line);
      return;
    }
    flushParagraph();
    const marker = match[2];
    const item = match[3];
    const nextType = marker === "-" || marker === "*" ? "ul" : "ol";
    const style = nextType === "ol" ? orderedStyle(marker) : undefined;
    if (!list || list.type !== nextType || (list.type === "ol" && list.style !== style)) {
      flushList();
      list = nextType === "ul" ? { type: "ul", items: [] } : { type: "ol", style: style!, items: [] };
    }
    list.items.push(item);
  });

  flushParagraph();
  flushList();
  return blocks;
}

function LinkPreviewAnchor({ href, children }: { href: string; children: ReactNode }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const targetHref = safeHref(href);

  useEffect(() => {
    if (!open || preview || loading || targetHref === "#") return;
    setLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(targetHref)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setPreview(data?.preview ?? null))
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [loading, open, preview, targetHref]);

  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <Link href={targetHref} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-4">
        {children}
      </Link>
      {open ? (
        <span className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-xl dark:border-white/10 dark:bg-slate-900">
          {loading ? (
            <span className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading preview...</span>
          ) : preview ? (
            <span className="block">
              {preview.image ? <img src={preview.image} alt="" className="aspect-video w-full object-cover" /> : null}
              <span className="block p-4">
                <span className="block text-xs font-bold uppercase text-primary">{preview.siteName || preview.url}</span>
                <span className="mt-1 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">{preview.title || preview.url}</span>
                {preview.description ? <span className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{preview.description}</span> : null}
                <span className="mt-3 block truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">{preview.url}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500"><ExternalLink className="h-3 w-3" /> Open in new tab</span>
              </span>
            </span>
          ) : (
            <span className="block p-4">
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Link preview</span>
              <span className="mt-2 block truncate font-mono text-xs text-slate-500">{targetHref}</span>
            </span>
          )}
        </span>
      ) : null}
    </span>
  );
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${match.index}-${match[0]}`;
    if (match[2] && match[3]) nodes.push(<LinkPreviewAnchor key={key} href={match[3]}>{parseInline(match[2])}</LinkPreviewAnchor>);
    else if (match[4]) nodes.push(<strong key={key}>{parseInline(match[4])}</strong>);
    else if (match[5]) nodes.push(<u key={key}>{parseInline(match[5])}</u>);
    else if (match[6]) nodes.push(<s key={key}>{parseInline(match[6])}</s>);
    else if (match[7]) nodes.push(<em key={key}>{parseInline(match[7])}</em>);
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderInlineWithBreaks(text: string) {
  return text.split(/\n|<br\s*\/?>/i).flatMap((line, index) => (index === 0 ? parseInline(line) : [<br key={`br-${index}`} />, ...parseInline(line)]));
}

function renderHtmlNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (/<br\s*\/?>/i.test(text)) return renderInlineWithBreaks(text);
    return text;
  }
  if (!(node instanceof HTMLElement)) return null;

  const children = Array.from(node.childNodes).map((child, index) => renderHtmlNode(child, `${key}-${index}`));
  const tag = node.tagName.toLowerCase();

  if (tag === "br") return <br key={key} />;
  if (tag === "strong" || tag === "b") return <strong key={key}>{children}</strong>;
  if (tag === "em" || tag === "i") return <em key={key}>{children}</em>;
  if (tag === "u") return <u key={key}>{children}</u>;
  if (tag === "s" || tag === "strike") return <s key={key}>{children}</s>;
  if (tag === "a") return <LinkPreviewAnchor key={key} href={node.getAttribute("href") ?? "#"}>{children}</LinkPreviewAnchor>;
  if (tag === "li") return <li key={key}>{children}</li>;
  if (tag === "ul") {
    const dataList = node.getAttribute("data-list");
    return (
      <ul key={key} className={dataList === "check" || dataList === "cross" ? "my-4 grid list-none gap-2 pl-0 leading-7" : "my-4 grid list-disc gap-2 pl-6 leading-7"} data-list={dataList ?? undefined}>
        {children}
      </ul>
    );
  }
  if (tag === "ol") {
    const style = node.style.listStyleType ? { listStyleType: node.style.listStyleType } as CSSProperties : undefined;
    return <ol key={key} className="my-4 grid gap-2 pl-6 leading-7" style={style}>{children}</ol>;
  }
  if (tag === "details") return <details key={key} className="my-4 rounded-lg border border-slate-200 p-4 dark:border-white/10">{children}</details>;
  if (tag === "summary") return <summary key={key} className="cursor-pointer font-bold">{children}</summary>;
  if (tag === "p" || tag === "div") return <p key={key} className="my-4 leading-8">{children}</p>;
  return <span key={key}>{children}</span>;
}

function HtmlRenderer({ value }: { value: string }) {
  const nodes = useMemo(() => {
    if (typeof window === "undefined") return [];
    const document = new DOMParser().parseFromString(`<div>${value}</div>`, "text/html");
    return Array.from(document.body.firstElementChild?.childNodes ?? []).map((node, index) => renderHtmlNode(node, `html-${index}`));
  }, [value]);
  return <>{nodes}</>;
}

export function RichTextRenderer({ value, className }: RichTextRendererProps) {
  const normalizedValue = useMemo(() => normalizeRichText(value), [value]);
  const blocks = useMemo(() => parseBlocks(normalizedValue), [normalizedValue]);

  return (
    <div className={`${className ?? ""} [&_ul[data-list='check']_li]:before:mr-2 [&_ul[data-list='check']_li]:before:text-emerald-500 [&_ul[data-list='check']_li]:before:content-['✓'] [&_ul[data-list='cross']_li]:before:mr-2 [&_ul[data-list='cross']_li]:before:text-red-500 [&_ul[data-list='cross']_li]:before:content-['✕']`}>
      {isHtml(normalizedValue) ? (
        <HtmlRenderer value={normalizedValue} />
      ) : (
        blocks.map((block, index) => {
          if (block.type === "p") return <p key={index} className="my-4 leading-8">{renderInlineWithBreaks(block.text)}</p>;
          if (block.type === "ul") {
            return (
              <ul key={index} className="my-4 grid list-disc gap-2 pl-6 leading-7">
                {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{parseInline(item)}</li>)}
              </ul>
            );
          }
          return (
            <ol key={index} className="my-4 grid gap-2 pl-6 leading-7" style={{ listStyleType: block.style }}>
              {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{parseInline(item)}</li>)}
            </ol>
          );
        })
      )}
    </div>
  );
}
