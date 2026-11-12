"use client";

import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsKeys } from "../api/analytics.keys";
import { analyticsService } from "../api/analytics.service";
import {
  type CreateJobInput,
  type ExplanationRatingArgs,
  type FeedbackArgs,
} from "../types/analytics.types";

export function useCreateAnalysisJobMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...analyticsKeys.viewer(viewerId), "createAnalysisJob"],
    mutationFn: (input: CreateJobInput) =>
      run(input, (key) =>
        analyticsService.createAnalysisJob(input, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: analyticsKeys.viewer(viewerId),
      });
    },
  });
}

export function useCreateAnalysisFeedbackMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...analyticsKeys.viewer(viewerId), "createAnalysisFeedback"],
    mutationFn: (input: FeedbackArgs) =>
      run(input, (key) =>
        analyticsService.createAnalysisFeedback(
          input.analysisId,
          input.payload,
          {
            key,
          },
        ),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: analyticsKeys.viewer(viewerId),
      });
    },
  });
}

export function useRateAnalysisExplanationMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...analyticsKeys.viewer(viewerId), "rateAnalysisExplanation"],
    mutationFn: (input: ExplanationRatingArgs) =>
      run(input, (key) =>
        analyticsService.rateAnalysisExplanation(
          input.analysisId,
          input.payload,
          { key },
        ),
      ),
    onError: handleError,
    onSuccess: async (_, input) => {
      await client.invalidateQueries({
        queryKey: analyticsKeys.getAnalysisDetail(viewerId, input.analysisId),
      });
    },
  });
}
