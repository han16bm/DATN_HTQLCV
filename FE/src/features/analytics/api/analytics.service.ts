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
  type FilterQuery,
} from "@/features/analytics/types/analytics.types";
import { entityLabelSchema, page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type { MutationOptions, RequestOptions } from "@/services/api.types";
export const analyticsService: AnalyticsApi = {
  getDashboard(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient.get(`/dashboard`, dashboardSchema, {
      ...options,
      query,
    });
  },
  getDeadlineRisks(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient.get(`/analytics/risks`, risksSchema, {
      ...options,
      query,
    });
  },
  getWorkload(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient.get(`/analytics/workload`, workloadSchema, {
      ...options,
      query,
    });
  },
  getBottlenecks(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient.get(`/analytics/bottlenecks`, bottlenecksSchema, {
      ...options,
      query,
    });
  },
  getAnalysisSummary(query: AnalyticsQuery, options: RequestOptions = {}) {
    return apiClient.get(`/analytics/summary`, summarySchema, {
      ...options,
      query,
    });
  },
  createAnalysisJob(payload: CreateJobInput, options: MutationOptions) {
    return apiClient.post(`/analytics/jobs`, payload, jobSchema, options);
  },
  getAnalysisJob(jobId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/analytics/jobs/${encodeURIComponent(jobId)}`,
      jobSchema,
      options,
    );
  },
  getAnalysisDetail(analysisId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/analytics/details/${encodeURIComponent(analysisId)}`,
      analysisSchema,
      options,
    );
  },
  createAnalysisFeedback(
    analysisId: string,
    payload: FeedbackInput,
    options: MutationOptions,
  ) {
    return apiClient.post(
      `/analytics/details/${encodeURIComponent(analysisId)}/feedback`,
      payload,
      feedbackSchema,
      options,
    );
  },
  listAnalyticsFilterOptions(query: FilterQuery, options: RequestOptions = {}) {
    return apiClient.get(`/analytics/filter-options`, page(entityLabelSchema), {
      ...options,
      query,
    });
  },
};
