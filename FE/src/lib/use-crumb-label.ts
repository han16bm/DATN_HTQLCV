"use client";
import { useUI } from "@/stores/ui-store";
import { useEffect } from "react";

export function useCrumbLabel(
  kind: string,
  id: string,
  label: string | undefined,
  parentId?: string,
) {
  const setLabel = useUI((s) => s.setLabel);
  const registered = useUI((s) => s.labels[`${kind}:${id}`]?.label === label);
  useEffect(() => {
    if (label && !registered) setLabel(`${kind}:${id}`, label, parentId);
  }, [kind, id, label, parentId, registered, setLabel]);
}
