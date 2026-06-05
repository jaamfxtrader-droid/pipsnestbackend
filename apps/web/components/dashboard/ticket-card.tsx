import { Badge } from "@/components/ui/badge";

export function TicketCard({ ticket }: { ticket: any }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">{ticket.id}</p>
          <h3 className="mt-1 font-semibold">{ticket.subject}</h3>
        </div>
        <Badge tone={ticket.status === "resolved" ? "profit" : "warning"}>{ticket.status}</Badge>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Priority: {ticket.priority}</p>
    </div>
  );
}
