"use client";

import { fingerprint } from "@/lib/crypto/fingerprint";
import { useRef } from "react";

export function useIdempotentRequest() {
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  return async function run<T>(
    input: unknown,
    request: (key: string) => Promise<T>,
  ) {
    const hash = await fingerprint(input);
    if (attempt.current?.fingerprint !== hash)
      attempt.current = { fingerprint: hash, key: crypto.randomUUID() };
    const key = attempt.current.key;
    const result = await request(key);
    if (attempt.current?.key === key) attempt.current = null;
    return result;
  };
}
