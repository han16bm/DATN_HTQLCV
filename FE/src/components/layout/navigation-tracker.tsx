"use client";
import { useUI } from "@/stores/ui-store";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function NavigationTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const visit = useUI((s) => s.visit);
  useEffect(() => {
    visit(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search, visit]);
  return null;
}
