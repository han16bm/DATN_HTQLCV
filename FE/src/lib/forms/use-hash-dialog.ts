"use client";
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}
export function useHashDialog() {
  const name = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => "",
  );
  return {
    name,
    open: (value: string) => {
      window.location.hash = value;
    },
    close: () => {
      history.replaceState(
        history.state,
        "",
        window.location.pathname + window.location.search,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
  };
}
