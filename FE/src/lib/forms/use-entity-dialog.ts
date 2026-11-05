"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type DialogMode = "create" | "view" | "edit";
const modes: readonly string[] = ["create", "view", "edit"];

export function useEntityDialog() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = search.get("dialog") ?? "";
  const mode = modes.includes(value) ? (value as DialogMode) : null;
  const id = mode && mode !== "create" ? (search.get("id") ?? "") : "";
  const href = (next: DialogMode | null, nextId?: string) => {
    const params = new URLSearchParams(search);
    params.delete("dialog");
    params.delete("id");
    if (next) params.set("dialog", next);
    if (next && next !== "create" && nextId) params.set("id", nextId);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  return {
    mode: mode && mode !== "create" && !id ? null : mode,
    id,
    href,
    open: (next: DialogMode, nextId?: string) =>
      router.push(href(next, nextId), { scroll: false }),
    switchTo: (next: DialogMode, nextId?: string) =>
      router.replace(href(next, nextId), { scroll: false }),
    close: () => router.replace(href(null), { scroll: false }),
  };
}
