"use client";

import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { reportsKeys } from "@/features/reports/api/reports.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeLogsKeys } from "../api/time-logs.keys";
import { timeLogsService } from "../api/time-logs.service";
import {
  type CreateTimeLogArgs,
  type UpdateTimeLogArgs,
  type VoidTimeLogArgs,
} from "../types/time-logs.types";

export function useCreateTimeLogMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...timeLogsKeys.viewer(viewerId), "createTimeLog"],
    mutationFn: (input: CreateTimeLogArgs) =>
      run(input, (key) =>
        timeLogsService.createTimeLog(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: timeLogsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useUpdateTimeLogMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...timeLogsKeys.viewer(viewerId), "updateTimeLog"],
    mutationFn: (input: UpdateTimeLogArgs) =>
      run(input, (key) =>
        timeLogsService.updateTimeLog(input.timeLogId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: timeLogsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useVoidTimeLogMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...timeLogsKeys.viewer(viewerId), "voidTimeLog"],
    mutationFn: (input: VoidTimeLogArgs) =>
      run(input, (key) =>
        timeLogsService.voidTimeLog(input.timeLogId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: timeLogsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
