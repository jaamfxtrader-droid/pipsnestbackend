"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import type { Column } from "./data-table";

export function ClientDataTable<T>({
  columns,
  data,
  empty = "No records found. When data is available, it will appear here.",
  loading = false,
  pageSize = 5
}: {
  columns: Column<T>[];
  data: T[];
  empty?: string;
  loading?: boolean;
  pageSize?: number;
}) {
  return (
    <RenderedDataTable
      columns={columns.map((column) => column.header)}
      rows={data.map((row) => columns.map((column) => column.cell(row)))}
      empty={empty}
      loading={loading}
      pageSize={pageSize}
    />
  );
}

export function RenderedDataTable({
  columns,
  rows,
  empty = "No records found. When data is available, it will appear here.",
  loading = false,
  pageSize = 5
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
  loading?: boolean;
  pageSize?: number;
}) {
  const { tx } = useTranslation();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, rows]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {tx(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-white/10">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {tx("Loading data")}
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                  <div className="mx-auto max-w-sm">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{tx("No data to show")}</div>
                    <p className="mt-1 text-sm leading-6">{tx(empty)}</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => (
                <tr key={index} className={cn(index !== visibleRows.length - 1 && "border-b border-slate-200 dark:border-white/10")}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${columns[cellIndex]}-${cellIndex}`} className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-white/10">
          <span className="text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" className="h-8 rounded-md px-3" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
              {tx("Prev")}
            </Button>
            <span className="rounded-md bg-slate-100 px-3 py-1 font-semibold dark:bg-white/10">
              {page} / {totalPages}
            </span>
            <Button type="button" variant="secondary" className="h-8 rounded-md px-3" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
              {tx("Next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
