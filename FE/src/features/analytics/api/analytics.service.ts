import { entityLabelSchema, page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  apiClient,
} from "@/services/api-client";
import { analysisSchema } from "../schemas/analysis-detail.schema";
import { feedbackSchema } from "../schemas/analysis-feedback.schema";
import { jobSchema } from "../schemas/analysis-job.schema";
import { bottlenecksSchema } from "../schemas/bottlenecks.schema";
import { dashboardSchema } from "../schemas/dashboard.schema";
import { risksSchema } from "../schemas/risks.schema";
import { summarySchema } from "../schemas/summary.schema";
import { workloadSchema } from "../schemas/workload.schema";
import type {
  AnalysisDto,
  AnalyticsQuery,
  BottlenecksDto,
  CreateJobInput,
  DashboardDto,
  FeedbackDto,
  FeedbackInput,
  FilterList,
  FilterOptionsQuery,
  JobDto,
  RisksDto,
  SummaryDto,
  WorkloadDto,
} from "../types/analytics.types";

export const analyticsService = {
  async getDashboard(query: AnalyticsQuery, options: RequestOptions = {}) {
    const response = await apiClient.get<DashboardDto>("/dashboard", {
      ...options,
      params: query,
      schema: dashboardSchema,
    });
    return response.data;
  },

  async getDeadlineRisks(query: AnalyticsQuery, options: RequestOptions = {}) {
    const response = await apiClient.get<RisksDto>("/analytics/risks", {
      ...options,
      params: query,
      schema: risksSchema,
    });
    return response.data;
  },

  async getWorkload(query: AnalyticsQuery, options: RequestOptions = {}) {
    const response = await apiClient.get<WorkloadDto>("/analytics/workload", {
      ...options,
      params: query,
      schema: workloadSchema,
    });
    return response.data;
  },

  async getBottlenecks(query: AnalyticsQuery, options: RequestOptions = {}) {
    const response = await apiClient.get<BottlenecksDto>(
      "/analytics/bottlenecks",
      { ...options, params: query, schema: bottlenecksSchema },
    );
    return response.data;
  },

  async getAnalysisSummary(
    query: AnalyticsQuery,
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<SummaryDto>("/analytics/summary", {
      ...options,
      params: query,
      schema: summarySchema,
    });
    return response.data;
  },

  async createAnalysisJob(payload: CreateJobInput, options: MutationOptions) {
    const response = await apiClient.post<JobDto>("/analytics/jobs", payload, {
      ...options,
      schema: jobSchema,
    });
    return response.data;
  },

  async getAnalysisJob(jobId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<JobDto>(
      `/analytics/jobs/${encodeURIComponent(jobId)}`,
      { ...options, schema: jobSchema },
    );
    return response.data;
  },

  async getAnalysisDetail(analysisId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<AnalysisDto>(
      `/analytics/details/${encodeURIComponent(analysisId)}`,
      { ...options, schema: analysisSchema },
    );
    return response.data;
  },

  async createAnalysisFeedback(
    analysisId: string,
    payload: FeedbackInput,
    options: MutationOptions,
  ) {
    const response = await apiClient.post<FeedbackDto>(
      `/analytics/details/${encodeURIComponent(analysisId)}/feedback`,
      payload,
      { ...options, schema: feedbackSchema },
    );
    return response.data;
  },

  async listAnalyticsFilterOptions(
    query: FilterOptionsQuery,
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<FilterList>(
      "/analytics/filter-options",
      { ...options, params: query, schema: page(entityLabelSchema) },
    );
    return response.data;
  },
};
