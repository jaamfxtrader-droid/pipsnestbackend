"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/lib/use-translation";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  const { tx } = useTranslation();

  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{tx(title)}</h1>
        {description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{tx(description)}</p> : null}
      </div>
      {action}
    </div>
  );
}
