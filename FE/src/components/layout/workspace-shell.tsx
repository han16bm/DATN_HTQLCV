"use client";
import { type ReactNode } from "react";
import { AppShell } from "./app-shell";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return <AppShell area="workspace">{children}</AppShell>;
}
