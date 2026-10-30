import { AdminShell } from "@/components/layout/admin-shell";
import { type ReactNode } from "react";
export default function Layout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
