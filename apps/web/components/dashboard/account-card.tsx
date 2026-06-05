import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export function AccountCard({ account }: { account: any }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{account.platform} / {account.server}</p>
          <h3 className="mt-1 text-lg font-semibold">{account.login}</h3>
        </div>
        <Badge tone={account.status === "active" ? "profit" : "warning"}>{account.status}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-slate-500">Challenge</span><strong className="block">{account.challenge}</strong></div>
        <div><span className="text-slate-500">Equity</span><strong className="block">{account.equity}</strong></div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm"><span>Target progress</span><strong>{account.progress}%</strong></div>
        <ProgressBar value={account.progress} />
      </div>
    </div>
  );
}
