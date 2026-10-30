"use client";
import { type ReactNode } from "react";
import { AppShell } from "./app-shell";

export function AdminShell({ children }: { children: ReactNode }) {
  return <AppShell area="admin">{children}</AppShell>;
}
