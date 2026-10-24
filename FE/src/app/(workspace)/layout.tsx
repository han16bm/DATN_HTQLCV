import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { type ReactNode } from "react";
export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
