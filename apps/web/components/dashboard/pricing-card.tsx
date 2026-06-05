import { Check } from "lucide-react";
import { AuthAwareLink } from "@/components/auth/auth-aware-link";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

export function PricingCard({ program }: { program: any }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="text-xl font-semibold">{program.name}</h3>
      <div className="mt-3 text-3xl font-semibold">{currency(program.price)}</div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currency(program.accountSize)} simulated account</p>
      <ul className="mt-6 grid gap-3 text-sm">
        {[
          `${program.profitTarget}% profit target`,
          `${program.dailyDrawdown}% daily drawdown`,
          `${program.maxDrawdown}% max drawdown`,
          `${program.leverage} leverage`
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-profit" /> {item}
          </li>
        ))}
      </ul>
      <AuthAwareLink href="/auth/login" authenticatedHref="/dashboard/purchase">
        <Button className="mt-6 w-full">Purchase</Button>
      </AuthAwareLink>
    </div>
  );
}
