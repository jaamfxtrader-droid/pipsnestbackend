"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span className="inline-flex h-10 w-[76px] rounded-full border border-white/35 bg-white/35 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/10" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
      aria-pressed={resolvedTheme === "dark"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative inline-flex h-10 w-[76px] items-center rounded-full border border-slate-200 bg-white/75 p-1 shadow-sm backdrop-blur-xl transition hover:border-primary/40 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full text-amber-500">
        <Sun className="h-4 w-4" />
      </span>
      <span className="grid h-8 w-8 place-items-center rounded-full text-blue-200">
        <Moon className="h-4 w-4" />
      </span>
      <span
        className={`absolute left-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition-transform duration-300 dark:bg-[#0b1730] dark:text-white ${
          isDark ? "translate-x-9" : "translate-x-0"
        }`}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
      </span>
    </button>
  );
}
