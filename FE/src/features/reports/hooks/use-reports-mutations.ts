"use client";

import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsKeys } from "../api/reports.keys";
import { reportsService } from "../api/reports.service";
import {
  type CreateReportDraftInput,
  type RefreshReportDraftArgs,
  type SubmitReportArgs,
  type UpdateReportDraftArgs,
} from "../types/reports.types";

export function useCreateReportDraftMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...reportsKeys.viewer(viewerId), "createReportDraft"],
    mutationFn: (input: CreateReportDraftInput) =>
      run(input, (key) =>
        reportsService.createReportDraft(input, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: reportsKeys.viewer(viewerId),
      });
    },
  });
}

export function useUpdateReportDraftMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...reportsKeys.viewer(viewerId), "updateReportDraft"],
    mutationFn: (input: UpdateReportDraftArgs) =>
      run(input, (key) =>
        reportsService.updateReportDraft(input.reportId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: reportsKeys.viewer(viewerId),
      });
    },
  });
}

export function useRefreshReportDraftMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...reportsKeys.viewer(viewerId), "refreshReportDraft"],
    mutationFn: (input: RefreshReportDraftArgs) =>
      run(input, (key) =>
        reportsService.refreshReportDraft(input.reportId, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: reportsKeys.viewer(viewerId),
      });
    },
  });
}

export function useSubmitReportMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...reportsKeys.viewer(viewerId), "submitReport"],
    mutationFn: (input: SubmitReportArgs) =>
      run(input, (key) =>
        reportsService.submitReport(input.reportId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
