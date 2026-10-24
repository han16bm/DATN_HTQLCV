"use client";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { reportsKeys } from "@/features/reports/api/reports.keys";
import {
  type CreateReportDraftInput,
  type RefreshReportDraftArgs,
  type SubmitReportArgs,
  type UpdateReportDraftArgs,
} from "@/features/reports/types/reports.types";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService } from "../api/reports.service";

export function useCreateReportDraftMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["reports", viewerId, "createReportDraft"],
    mutationFn: async (input: CreateReportDraftInput) =>
      reportsService.createReportDraft(input, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: reportsKeys.viewer(viewerId),
      });
    },
  });
}
export function useUpdateReportDraftMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["reports", viewerId, "updateReportDraft"],
    mutationFn: async (input: UpdateReportDraftArgs) =>
      reportsService.updateReportDraft(input.reportId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: reportsKeys.viewer(viewerId),
      });
    },
  });
}
export function useRefreshReportDraftMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["reports", viewerId, "refreshReportDraft"],
    mutationFn: async (input: RefreshReportDraftArgs) =>
      reportsService.refreshReportDraft(input.reportId, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: reportsKeys.viewer(viewerId),
      });
    },
  });
}
export function useSubmitReportMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["reports", viewerId, "submitReport"],
    mutationFn: async (input: SubmitReportArgs) =>
      reportsService.submitReport(input.reportId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
