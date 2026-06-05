import type { ReactNode } from "react";
import { RenderedDataTable } from "./data-table-client";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
};

export function DataTable<T>({
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
