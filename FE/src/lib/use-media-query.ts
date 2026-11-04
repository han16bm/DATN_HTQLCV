"use client";
import { useSyncExternalStore } from "react";

// Khớp media query của trình duyệt; phía server và môi trường không có matchMedia
// coi như không khớp.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () =>
      typeof window.matchMedia === "function"
        ? window.matchMedia(query).matches
        : false,
    () => false,
  );
}
