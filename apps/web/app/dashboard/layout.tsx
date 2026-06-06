import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { privateAreaMetadata } from "@/lib/seo";

export const metadata = privateAreaMetadata;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell variant="dashboard">{children}</WorkspaceShell>;
}
