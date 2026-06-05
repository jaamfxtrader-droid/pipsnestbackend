import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  tone?: "primary" | "profit" | "warning" | "loss" | "neutral";
  className?: string;
};

const tones = {
  primary: "bg-primary/10 text-blue-700 ring-primary/20 dark:bg-primary/15 dark:text-blue-300 dark:ring-primary/25",
  profit: "bg-profit/10 text-green-700 ring-profit/20 dark:bg-profit/15 dark:text-green-300 dark:ring-profit/25",
  warning: "bg-warning/12 text-amber-700 ring-warning/25 dark:bg-warning/15 dark:text-amber-300",
  loss: "bg-loss/10 text-red-700 ring-loss/20 dark:bg-loss/15 dark:text-red-300",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20"
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1", tones[tone], className)}>
      {children}
    </span>
  );
}
