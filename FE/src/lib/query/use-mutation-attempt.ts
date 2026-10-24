"use client";
import { fingerprint } from "@/lib/crypto/fingerprint";
import { useRef } from "react";

export function useMutationAttempt() {
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  return {
    async keyFor(values: unknown) {
      const next = await fingerprint(values);
      if (attempt.current?.fingerprint !== next)
        attempt.current = { fingerprint: next, key: crypto.randomUUID() };
      return attempt.current.key;
    },
    reset() {
      attempt.current = null;
    },
  };
}
