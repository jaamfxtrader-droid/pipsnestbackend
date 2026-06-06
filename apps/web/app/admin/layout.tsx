import type { ReactNode } from "react";
import { AdminGuard } from "@/components/layout/admin-guard";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { privateAreaMetadata } from "@/lib/seo";

export const metadata = privateAreaMetadata;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <WorkspaceShell variant="admin">{children}</WorkspaceShell>
    </AdminGuard>
  );
}
