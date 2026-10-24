"use client";
import { useState } from "react";

export function useEditSnapshot<T>(initial: T) {
  const [base, setBase] = useState(initial);
  const [latest, setLatest] = useState<T | null>(null);
  return {
    base,
    saved: setBase,
    load: async (refetch: () => Promise<{ data?: T }>) => {
      const result = await refetch();
      if (!result.data) throw new Error("Không tải được phiên bản mới.");
      setLatest(result.data);
      return result.data;
    },
    accept: () => {
      if (latest) setBase(latest);
    },
  };
}
