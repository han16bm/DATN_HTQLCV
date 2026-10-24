"use client";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import {
  type CreateJobInput,
  type FeedbackArgs,
} from "@/features/analytics/types/analytics.types";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsService } from "../api/analytics.service";

export function useCreateAnalysisJobMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["analytics", viewerId, "createAnalysisJob"],
    mutationFn: async (input: CreateJobInput) =>
      analyticsService.createAnalysisJob(input, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: analyticsKeys.viewer(viewerId),
      });
    },
  });
}
export function useCreateAnalysisFeedbackMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["analytics", viewerId, "createAnalysisFeedback"],
    mutationFn: async (input: FeedbackArgs) =>
      analyticsService.createAnalysisFeedback(input.analysisId, input.payload, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: analyticsKeys.viewer(viewerId),
      });
    },
  });
}
