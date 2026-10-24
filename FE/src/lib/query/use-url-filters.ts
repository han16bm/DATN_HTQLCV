"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function useUrlFilters() {
  const search = useSearchParams();
  const router = useRouter();
  const setMany = (values: Record<string, string>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in values)) next.delete("page");
    router.replace(`?${next}`, { scroll: false });
  };
  return {
    get: (key: string) => search.get(key) ?? "",
    page: Math.max(1, Number(search.get("page")) || 1),
    setMany,
    set: (key: string, value: string) => {
      setMany({ [key]: value });
    },
  };
}
