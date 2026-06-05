import type { ReactNode } from "react";
import { AdminGuard } from "@/components/layout/admin-guard";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <WorkspaceShell variant="admin">{children}</WorkspaceShell>
    </AdminGuard>
  );
}
