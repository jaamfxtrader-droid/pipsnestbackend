import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { currency } from "@/lib/utils";

export function ChallengeCard({ program }: { program: any }) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      {program.featured ? <Badge tone="profit" className="absolute right-4 top-4">Popular</Badge> : null}
      <div className="text-sm font-semibold text-primary">{program.phase}</div>
      <h3 className="mt-3 text-2xl font-semibold">{currency(program.accountSize)}</h3>
      <p className="mt-1 text-slate-500 dark:text-slate-400">{program.name} Challenge</p>
      <div className="mt-6 grid gap-3 text-sm">
        <div className="flex justify-between"><span>Price</span><strong>{currency(program.price)}</strong></div>
        <div className="flex justify-between"><span>Profit target</span><strong>{program.profitTarget}%</strong></div>
        <div className="flex justify-between"><span>Daily drawdown</span><strong>{program.dailyDrawdown}%</strong></div>
        <div className="flex justify-between"><span>Max drawdown</span><strong>{program.maxDrawdown}%</strong></div>
        <div className="flex justify-between"><span>Minimum days</span><strong>{program.minDays}</strong></div>
      </div>
      <div className="mt-5">
        <ProgressBar value={program.featured ? 71 : 38} />
      </div>
      <Button className="mt-6 w-full">
        Choose Plan <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
