"use client";
import { useUI } from "@/stores/ui-store";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Ghi nhớ URL đang xem để các trang con quay lại đúng bộ lọc, chế độ xem, trang.
export function NavigationTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const visit = useUI((s) => s.visit);
  useEffect(() => {
    visit(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search, visit]);
  return null;
}
