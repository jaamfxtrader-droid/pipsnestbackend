import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-primary/10 text-blue-700 dark:bg-primary/15 dark:text-blue-300",
  profit: "bg-profit/10 text-green-700 dark:bg-profit/15 dark:text-green-300",
  warning: "bg-warning/10 text-amber-700 dark:bg-warning/15 dark:text-amber-300",
  loss: "bg-loss/10 text-red-700 dark:bg-loss/15 dark:text-red-300"
};

export function DashboardCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "primary"
}: {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{label}</p>
          <p className="mt-2 truncate text-lg font-semibold sm:text-2xl">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{change}</p>
        </div>
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md sm:h-10 sm:w-10", tones[tone])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
    </div>
  );
}
