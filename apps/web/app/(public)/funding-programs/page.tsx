import { PricingCard } from "@/components/dashboard/pricing-card";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { fundingPrograms } from "@/lib/mock-data";

export default async function FundingProgramsPage() {
  const page = await getCmsPage("funding-programs");
  const intro = getCmsSection(page, "intro");

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="font-semibold text-primary">{intro?.eyebrow ?? "Funding Programs"}</p>
        <h1 className="mt-3 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
        <p className="mt-5 text-slate-600 dark:text-slate-400">{intro?.content ?? page?.content}</p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {fundingPrograms.map((program) => (
          <PricingCard key={program.id} program={program} />
        ))}
      </div>
    </main>
  );
}
