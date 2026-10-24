"use client";
import { useSession } from "@/lib/auth/session-context";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { analyticsKeys } from "../api/analytics.keys";
import { useGetAnalysisJobQuery } from "./use-analytics-queries";

export function useAnalysisTracking(jobId: string | null) {
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(0);
  const client = useQueryClient();
  const { session } = useSession();
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (!jobId) return;
    setPaused(false);
    const timer = setTimeout(() => setPaused(true), 120000);
    return () => clearTimeout(timer);
  }, [jobId, round]);
  const query = useGetAnalysisJobQuery(jobId ?? "", {
    enabled: Boolean(jobId),
    poll: paused ? false : 2000,
  });
  const terminal =
    query.data && ["SUCCEEDED", "FAILED"].includes(query.data.status)
      ? query.data
      : null;
  useEffect(() => {
    if (terminal && seen.current !== terminal.id + terminal.status) {
      seen.current = terminal.id + terminal.status;
      void client.invalidateQueries({
        queryKey: analyticsKeys.getAnalysisDetail(
          session?.user.id ?? "anonymous",
          terminal.analysisId,
        ),
      });
    }
  }, [terminal, client, session?.user.id]);
  return {
    query,
    paused: paused && !terminal,
    resume: () => {
      setRound((r) => r + 1);
      void query.refetch();
    },
  };
}
