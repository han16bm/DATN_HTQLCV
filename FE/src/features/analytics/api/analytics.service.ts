import type { AnalyticsApi } from "@/features/analytics/api/analytics.contract";
import { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import { feedbackSchema } from "@/features/analytics/schemas/analysis-feedback.schema";
import { jobSchema } from "@/features/analytics/schemas/analysis-job.schema";
import { bottlenecksSchema } from "@/features/analytics/schemas/bottlenecks.schema";
import { dashboardSchema } from "@/features/analytics/schemas/dashboard.schema";
import { risksSchema } from "@/features/analytics/schemas/risks.schema";
import { summarySchema } from "@/features/analytics/schemas/summary.schema";
import { workloadSchema } from "@/features/analytics/schemas/workload.schema";
import {
  type AnalyticsQuery,
  type CreateJobInput,
  type FeedbackInput,
  type FilterOptionsQuery,
} from "@/features/analytics/types/analytics.types";
import { entityLabelSchema, page } from "@/lib/validation/common.schema";
import type { MutationOptions, RequestOptions } from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const analyticsService: AnalyticsApi = {
  getDashboard(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/dashboard", { ...options, params: query })
      .then(parseResponse(dashboardSchema));
  },
  getDeadlineRisks(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/analytics/risks", { ...options, params: query })
      .then(parseResponse(risksSchema));
  },
  getWorkload(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/analytics/workload", { ...options, params: query })
      .then(parseResponse(workloadSchema));
  },
  getBottlenecks(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/analytics/bottlenecks", { ...options, params: query })
      .then(parseResponse(bottlenecksSchema));
  },
  getAnalysisSummary(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/analytics/summary", { ...options, params: query })
      .then(parseResponse(summarySchema));
  },
  createAnalysisJob(payload: CreateJobInput, options: MutationOptions) {
    return apiClient
      .post<unknown>("/analytics/jobs", payload, options)
      .then(parseResponse(jobSchema));
  },
  getAnalysisJob(jobId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/analytics/jobs/${encodeURIComponent(jobId)}`, options)
      .then(parseResponse(jobSchema));
  },
  getAnalysisDetail(analysisId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(
        `/analytics/details/${encodeURIComponent(analysisId)}`,
        options,
      )
      .then(parseResponse(analysisSchema));
  },
  createAnalysisFeedback(
    analysisId: string,
    payload: FeedbackInput,
    options: MutationOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/analytics/details/${encodeURIComponent(analysisId)}/feedback`,
        payload,
        options,
      )
      .then(parseResponse(feedbackSchema));
  },
  listAnalyticsFilterOptions(
    query: FilterOptionsQuery,
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>("/analytics/filter-options", { ...options, params: query })
      .then(parseResponse(page(entityLabelSchema)));
  },
};
