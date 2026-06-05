"use client";

import { useLenis } from "lenis/react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const lenis = useLenis();

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      title="Scroll to top"
      onClick={() => {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.05 });
          return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-white/60 bg-white/55 text-primary shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/10 dark:bg-[#07152d]/70 dark:text-blue-300 dark:hover:bg-[#0b1d3c]"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
