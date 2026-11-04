"use client";
import { useRouter, useSearchParams } from "next/navigation";

// Namespace tách bộ lọc của các danh sách cùng trang (công việc, thành viên, lịch sử).
export function useUrlFilters(prefix = "") {
  const search = useSearchParams();
  const router = useRouter();
  const setMany = (values: Record<string, string>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(prefix + key, value);
      else next.delete(prefix + key);
    }
    if (!("page" in values)) next.delete(prefix + "page");
    router.replace(`?${next}${window.location.hash}`, { scroll: false });
  };
  return {
    get: (key: string) => search.get(prefix + key) ?? "",
    page: Math.max(1, Number(search.get(prefix + "page")) || 1),
    setMany,
    set: (key: string, value: string) => {
      setMany({ [key]: value });
    },
  };
}
