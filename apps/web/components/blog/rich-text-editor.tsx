"use client";

import { useEffect, useRef, useState } from "react";
import { CheckSquare, ChevronDown, Link2, List, ListChecks, ListOrdered, XSquare } from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange(value: string): void;
  minHeight?: string;
  placeholder?: string;
};

type ListKind = "bullet" | "number" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman" | "check" | "cross" | "details";

const listOptions: Array<{ kind: ListKind; label: string }> = [
  { kind: "bullet", label: "Bullet" },
  { kind: "number", label: "Number" },
  { kind: "lower-alpha", label: "abc" },
  { kind: "upper-alpha", label: "ABC" },
  { kind: "lower-roman", label: "Roman i" },
  { kind: "upper-roman", label: "Roman I" },
  { kind: "check", label: "Tick list" },
  { kind: "cross", label: "Cross list" },
  { kind: "details", label: "Detail list" }
];

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMarkdownToHtml(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(value: string) {
  if (/<(?:p|div|ul|ol|li|strong|em|u|s|a|details|summary|br)\b/i.test(value)) return value;
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: { tag: "ul" | "ol"; style?: string; items: string[] } | null = null;
  const listPattern = /^(\s*)([-*]|\d+[.)]|[a-z]\.|[A-Z]\.|[ivxlcdm]+\)|[IVXLCDM]+\))\s+(.+)$/;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdownToHtml(paragraph.join("<br>"))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    const style = list.style ? ` style="list-style-type:${list.style}"` : "";
    html.push(`<${list.tag}${style}>${list.items.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join("")}</${list.tag}>`);
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
    const tag = marker === "-" || marker === "*" ? "ul" : "ol";
    const style = /^\d+[.)]$/.test(marker) ? "decimal" : /^[a-z]\.$/.test(marker) ? "lower-alpha" : /^[A-Z]\.$/.test(marker) ? "upper-alpha" : /^[ivxlcdm]+\)$/.test(marker) ? "lower-roman" : marker === "-" || marker === "*" ? undefined : "upper-roman";
    if (!list || list.tag !== tag || list.style !== style) {
      flushList();
      list = { tag, style, items: [] };
    }
    list.items.push(match[3]);
  });

  flushParagraph();
  flushList();
  return html.join("");
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function RichTextEditor({ value, onChange, minHeight = "min-h-56", placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const lastHtmlRef = useRef("");

  useEffect(() => {
    const html = markdownToHtml(value);
    if (editorRef.current && html !== lastHtmlRef.current && html !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = html;
      lastHtmlRef.current = html;
    }
  }, [value]);

  function sync() {
    const html = editorRef.current?.innerHTML ?? "";
    lastHtmlRef.current = html;
    onChange(html);
  }

  function run(command: string, argument?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    sync();
  }

  function capitalizeSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selected = selection.toString();
    if (!selected) return;
    run("insertText", titleCase(selected));
  }

  function openLinkInput() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setLinkUrl("");
    setLinkOpen(true);
  }

  function saveLink() {
    const url = linkUrl.trim();
    if (!url || !savedRangeRef.current) return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRangeRef.current);
    document.execCommand("createLink", false, url);
    const anchor = selection?.anchorNode?.parentElement?.closest("a") ?? selection?.focusNode?.parentElement?.closest("a");
    if (anchor) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noreferrer");
    }
    savedRangeRef.current = null;
    setLinkOpen(false);
    setLinkUrl("");
    sync();
  }

  function styleCurrentList(style: string, dataList?: string) {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    const list = element?.closest("ul,ol");
    if (!list) return;
    if (style) (list as HTMLElement).style.listStyleType = style;
    if (dataList) list.setAttribute("data-list", dataList);
  }

  function addDetails() {
    run("insertHTML", "<details open><summary>Detail title</summary><p>Detail text</p></details><p><br></p>");
  }

  function applyList(kind: ListKind) {
    setListOpen(false);
    if (kind === "details") {
      addDetails();
      return;
    }
    if (kind === "bullet" || kind === "check" || kind === "cross") run("insertUnorderedList");
    else run("insertOrderedList");
    requestAnimationFrame(() => {
      if (kind === "number") styleCurrentList("decimal");
      if (kind === "lower-alpha") styleCurrentList("lower-alpha");
      if (kind === "upper-alpha") styleCurrentList("upper-alpha");
      if (kind === "lower-roman") styleCurrentList("lower-roman");
      if (kind === "upper-roman") styleCurrentList("upper-roman");
      if (kind === "check") styleCurrentList("none", "check");
      if (kind === "cross") styleCurrentList("none", "cross");
      sync();
    });
  }

  const buttonClass = "inline-flex h-12 min-w-12 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-base font-black text-slate-950 shadow-sm transition hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700";
  const iconClass = "h-5 w-5";

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
        <button type="button" className={buttonClass} onClick={() => run("bold")} title="Bold" aria-label="Bold">B</button>
        <button type="button" className={`${buttonClass} italic`} onClick={() => run("italic")} title="Italic" aria-label="Italic">I</button>
        <button type="button" className={`${buttonClass} underline underline-offset-4`} onClick={() => run("underline")} title="Underline" aria-label="Underline">U</button>
        <button type="button" className={`${buttonClass} line-through`} onClick={() => run("strikeThrough")} title="Strike through" aria-label="Strike through">S</button>
        <button type="button" className={buttonClass} onClick={capitalizeSelection} title="Capitalize" aria-label="Capitalize">Aa</button>
        <div className="relative">
          <button type="button" className={`${buttonClass} gap-2`} onClick={openLinkInput} title="Link" aria-label="Link"><Link2 className={iconClass} /> Link</button>
          {linkOpen ? (
            <div className="absolute left-0 top-14 z-40 grid w-80 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900">
              <input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveLink();
                  if (event.key === "Escape") setLinkOpen(false);
                }}
                autoFocus
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary dark:border-white/15 dark:bg-slate-800 dark:text-white"
                placeholder="https://example.com"
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="h-9 rounded-md px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => setLinkOpen(false)}>Cancel</button>
                <button type="button" className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-blue-500" onClick={saveLink}>Save</button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button type="button" className={`${buttonClass} gap-2`} onClick={() => setListOpen((current) => !current)} title="Lists" aria-label="Lists">
            <ListChecks className="h-5 w-5" />
            List
            <ChevronDown className="h-4 w-4" />
          </button>
          {listOpen ? (
            <div className="absolute left-0 top-11 z-30 grid w-44 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-sm shadow-xl dark:border-white/10 dark:bg-slate-900">
              {listOptions.map((option) => (
                <button key={option.kind} type="button" className="flex items-center gap-2 rounded px-3 py-2 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => applyList(option.kind)}>
                  {option.kind === "bullet" ? <List className="h-4 w-4" /> : option.kind === "check" ? <CheckSquare className="h-4 w-4" /> : option.kind === "cross" ? <XSquare className="h-4 w-4" /> : <ListOrdered className="h-4 w-4" />}
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={sync}
        onBlur={sync}
        className={`${minHeight} overflow-y-auto rounded-md border border-slate-300/30 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 [&:empty:before]:text-slate-400 [&:empty:before]:content-[attr(data-placeholder)] [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_details]:my-3 [&_details]:rounded-md [&_details]:border [&_details]:border-slate-200 [&_details]:p-3 [&_li]:my-1 [&_ol]:my-3 [&_ol]:pl-6 [&_summary]:cursor-pointer [&_summary]:font-semibold [&_ul]:my-3 [&_ul]:pl-6 [&_ul[data-list='check']]:list-none [&_ul[data-list='check']_li]:before:mr-2 [&_ul[data-list='check']_li]:before:text-emerald-500 [&_ul[data-list='check']_li]:before:content-['✓'] [&_ul[data-list='cross']]:list-none [&_ul[data-list='cross']_li]:before:mr-2 [&_ul[data-list='cross']_li]:before:text-red-500 [&_ul[data-list='cross']_li]:before:content-['✕']`}
      />
    </div>
  );
}
