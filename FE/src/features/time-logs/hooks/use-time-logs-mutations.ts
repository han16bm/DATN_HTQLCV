"use client";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { reportsKeys } from "@/features/reports/api/reports.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { timeLogsKeys } from "@/features/time-logs/api/time-logs.keys";
import {
  type CreateTimeLogArgs,
  type UpdateTimeLogArgs,
  type VoidTimeLogArgs,
} from "@/features/time-logs/types/time-logs.types";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeLogsService } from "../api/time-logs.service";

export function useCreateTimeLogMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["time-logs", viewerId, "createTimeLog"],
    mutationFn: async (input: CreateTimeLogArgs) =>
      timeLogsService.createTimeLog(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["time-logs", viewerId, "updateTimeLog"],
    mutationFn: async (input: UpdateTimeLogArgs) =>
      timeLogsService.updateTimeLog(input.timeLogId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["time-logs", viewerId, "voidTimeLog"],
    mutationFn: async (input: VoidTimeLogArgs) =>
      timeLogsService.voidTimeLog(input.timeLogId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: timeLogsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
