"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SwitchField({
  checked,
  onChange,
  label,
  description,
  className,
  disabled = false
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04]",
        checked && "border-primary/40 bg-primary/10 text-blue-700 dark:text-blue-300",
        className
      )}
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        {description ? <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{description}</span> : null}
      </span>
      <span className={cn("inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition", checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700")}>
        <span className={cn("h-5 w-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </span>
    </button>
  );
}
