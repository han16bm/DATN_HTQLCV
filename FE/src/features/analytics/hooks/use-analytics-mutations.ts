// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/analytics.contract";
import { analyticsService } from "../api/analytics.service";
export function useCreateAnalysisJobMutation() {
  return useFeatureMutation(
    contracts.createAnalysisJobContract,
    analyticsService.createAnalysisJob,
  );
}
export function useCreateAnalysisFeedbackMutation() {
  return useFeatureMutation(
    contracts.createAnalysisFeedbackContract,
    analyticsService.createAnalysisFeedback,
  );
}
