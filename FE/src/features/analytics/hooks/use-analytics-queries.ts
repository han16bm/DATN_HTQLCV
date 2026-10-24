// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/analytics.contract";
import { analyticsService } from "../api/analytics.service";
import { analyticsKeys } from "../api/analytics.keys";
export function useGetDashboardQuery(
  request: ContractRequest<typeof contracts.getDashboardContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getDashboardContract,
    request,
    analyticsService.getDashboard,
    analyticsKeys.getDashboard,
    options,
  );
}
export function useGetDeadlineRisksQuery(
  request: ContractRequest<typeof contracts.getDeadlineRisksContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getDeadlineRisksContract,
    request,
    analyticsService.getDeadlineRisks,
    analyticsKeys.getDeadlineRisks,
    options,
  );
}
export function useGetWorkloadQuery(
  request: ContractRequest<typeof contracts.getWorkloadContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getWorkloadContract,
    request,
    analyticsService.getWorkload,
    analyticsKeys.getWorkload,
    options,
  );
}
export function useGetBottlenecksQuery(
  request: ContractRequest<typeof contracts.getBottlenecksContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getBottlenecksContract,
    request,
    analyticsService.getBottlenecks,
    analyticsKeys.getBottlenecks,
    options,
  );
}
export function useGetAnalysisSummaryQuery(
  request: ContractRequest<typeof contracts.getAnalysisSummaryContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getAnalysisSummaryContract,
    request,
    analyticsService.getAnalysisSummary,
    analyticsKeys.getAnalysisSummary,
    options,
  );
}
export function useGetAnalysisJobQuery(
  request: ContractRequest<typeof contracts.getAnalysisJobContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getAnalysisJobContract,
    request,
    analyticsService.getAnalysisJob,
    analyticsKeys.getAnalysisJob,
    options,
  );
}
export function useGetAnalysisDetailQuery(
  request: ContractRequest<typeof contracts.getAnalysisDetailContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getAnalysisDetailContract,
    request,
    analyticsService.getAnalysisDetail,
    analyticsKeys.getAnalysisDetail,
    options,
  );
}
export function useListAnalyticsFilterOptionsQuery(
  request: ContractRequest<typeof contracts.listAnalyticsFilterOptionsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listAnalyticsFilterOptionsContract,
    request,
    analyticsService.listAnalyticsFilterOptions,
    analyticsKeys.listAnalyticsFilterOptions,
    options,
  );
}
