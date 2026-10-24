import {
  type AnalysisDto,
  type AnalyticsQuery,
  type BottlenecksDto,
  type CreateJobInput,
  type DashboardDto,
  type FeedbackDto,
  type FeedbackInput,
  type FilterList,
  type FilterQuery,
  type JobDto,
  type RisksDto,
  type SummaryDto,
  type WorkloadDto,
} from "@/features/analytics/types/analytics.types";
import type { MutationOptions, RequestOptions } from "@/services/api.types";
export interface AnalyticsApi {
  getDashboard(
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<DashboardDto>;
  getDeadlineRisks(
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<RisksDto>;
  getWorkload(
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<WorkloadDto>;
  getBottlenecks(
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<BottlenecksDto>;
  getAnalysisSummary(
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<SummaryDto>;
  createAnalysisJob(
    payload: CreateJobInput,
    options: MutationOptions,
  ): Promise<JobDto>;
  getAnalysisJob(jobId: string, options?: RequestOptions): Promise<JobDto>;
  getAnalysisDetail(
    analysisId: string,
    options?: RequestOptions,
  ): Promise<AnalysisDto>;
  createAnalysisFeedback(
    analysisId: string,
    payload: FeedbackInput,
    options: MutationOptions,
  ): Promise<FeedbackDto>;
  listAnalyticsFilterOptions(
    query: FilterQuery,
    options?: RequestOptions,
  ): Promise<FilterList>;
}
