import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PayoutCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-profit/15 text-green-300">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Next payout</p>
          <h3 className="text-xl font-semibold">$850.00</h3>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span>Bank Transfer</span>
        <Badge tone="warning">pending</Badge>
      </div>
    </div>
  );
}
