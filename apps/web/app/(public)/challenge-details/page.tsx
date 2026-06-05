import { Badge } from "@/components/ui/badge";
import { getCmsPage, getCmsSection } from "@/lib/cms";

const rules = [
  ["Profit target", "8% to 10% depending on account size"],
  ["Daily drawdown", "4% to 5% hard daily risk limit"],
  ["Max drawdown", "8% to 10% total account drawdown"],
  ["Minimum days", "5 to 7 trading days"],
  ["Status flow", "pending, active, passed, failed, suspended"]
];

export default async function ChallengeDetailsPage() {
  const page = await getCmsPage("challenge-details");
  const intro = getCmsSection(page, "intro");
  const rulesSection = getCmsSection(page, "rules");

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge tone="primary">{intro?.eyebrow ?? "Challenge Details"}</Badge>
      <h1 className="mt-5 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
      <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">{intro?.content ?? page?.content}</p>
      <div className="mt-10">
        <h2 className="text-2xl font-semibold">{rulesSection?.title}</h2>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{rulesSection?.content}</p>
      </div>
      <div className="mt-10 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        {rules.map(([label, value], index) => (
          <div key={label} className="grid gap-2 border-b border-slate-200 p-5 last:border-b-0 dark:border-white/10 sm:grid-cols-[220px_1fr]">
            <strong>{label}</strong>
            <span className="text-slate-600 dark:text-slate-400">{value}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
