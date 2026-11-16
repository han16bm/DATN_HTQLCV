"use client";

import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { auditLogsKeys } from "@/features/audit-logs/api/audit-logs.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsKeys } from "../api/jobs.keys";
import { jobsService } from "../api/jobs.service";
import type { UpdateJobArgs } from "../types/jobs.types";

export function useUpdateJobMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...jobsKeys.viewer(viewerId), "updateJob"],
    mutationFn: (input: UpdateJobArgs) =>
      run(input, (key) =>
        jobsService.updateJob(input.code, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: jobsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: auditLogsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useRunJobMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  return useMutation({
    mutationKey: [...jobsKeys.viewer(viewerId), "runJob"],
    mutationFn: (code: string) =>
      jobsService.runJob(code, { key: crypto.randomUUID() }),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: jobsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
