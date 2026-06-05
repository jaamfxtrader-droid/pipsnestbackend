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
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{change}</p>
        </div>
        <span className={cn("grid h-10 w-10 place-items-center rounded-md", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
