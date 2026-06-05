"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Globe2 } from "lucide-react";
import { languages } from "@/lib/i18n";
import { useTranslation } from "@/lib/use-translation";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, selected, setLanguage } = useTranslation();
  const options = languages;
  const listRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const maxScrollTop = list.scrollHeight - list.clientHeight;
    setCanScrollUp(list.scrollTop > 2);
    setCanScrollDown(list.scrollTop < maxScrollTop - 2);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) {
      window.cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(
    (direction: "up" | "down") => {
      stopAutoScroll();
      let previousTime: number | null = null;

      const step = (time: number) => {
        const list = listRef.current;
        if (!list) {
          stopAutoScroll();
          return;
        }

        if (previousTime === null) previousTime = time;
        const delta = Math.min(time - previousTime, 32);
        previousTime = time;

        list.scrollTop += (direction === "up" ? -1 : 1) * delta * 0.42;
        updateScrollState();

        const maxScrollTop = list.scrollHeight - list.clientHeight;
        const atEdge = direction === "up" ? list.scrollTop <= 1 : list.scrollTop >= maxScrollTop - 1;
        if (atEdge) {
          stopAutoScroll();
          return;
        }

        autoScrollRef.current = window.requestAnimationFrame(step);
      };

      autoScrollRef.current = window.requestAnimationFrame(step);
    },
    [stopAutoScroll, updateScrollState]
  );

  useEffect(() => {
    updateScrollState();
    const frame = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
      stopAutoScroll();
    };
  }, [options.length, stopAutoScroll, updateScrollState]);

  const scrollList = (direction: "up" | "down") => {
    const list = listRef.current;
    if (!list) return;

    list.scrollBy({
      top: direction === "up" ? -148 : 148,
      behavior: "smooth"
    });
    window.setTimeout(updateScrollState, 260);
  };

  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/15 dark:bg-[#0b1730] dark:text-white dark:hover:border-primary/40 dark:hover:bg-[#101f3d]"
      >
        <Globe2 className="h-4 w-4" />
        <span>{compact ? selected.code.toUpperCase() : selected.nativeName}</span>
        <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
      </button>
      <div className="invisible pointer-events-none absolute right-0 top-full z-50 w-72 origin-top translate-y-3 scale-95 pt-3 opacity-0 transition duration-300 ease-out group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <div className="relative h-[384px] overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/15 dark:bg-[#0b1730] dark:shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
          {canScrollUp ? (
            <button
              type="button"
              aria-label="Scroll languages up"
              onClick={() => scrollList("up")}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onBlur={stopAutoScroll}
              className="absolute inset-x-0 top-0 z-20 flex h-9 items-center justify-center rounded-t-lg border-b border-slate-200/60 bg-gradient-to-b from-white/95 via-white/80 to-white/5 text-slate-700 backdrop-blur-xl transition hover:text-primary dark:border-white/10 dark:from-[#07152d]/95 dark:via-[#07152d]/80 dark:to-[#07152d]/5 dark:text-white dark:hover:text-blue-300"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          ) : null}
          {canScrollDown ? (
            <button
              type="button"
              aria-label="Scroll languages down"
              onClick={() => scrollList("down")}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onBlur={stopAutoScroll}
              className="absolute inset-x-0 bottom-0 z-20 flex h-9 items-center justify-center rounded-b-lg border-t border-slate-200/60 bg-gradient-to-t from-white/95 via-white/80 to-white/5 text-slate-700 backdrop-blur-xl transition hover:text-primary dark:border-white/10 dark:from-[#07152d]/95 dark:via-[#07152d]/80 dark:to-[#07152d]/5 dark:text-white dark:hover:text-blue-300"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          ) : null}
          <div
            ref={listRef}
            data-lenis-prevent
            onScroll={updateScrollState}
            className="h-full overflow-y-auto py-9 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {options.map((item) => {
              const active = item.code === language;

              return (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-slate-950 text-white dark:bg-primary dark:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {active ? <Check className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{item.nativeName}</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-300">{item.label}</span>
              </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
