import {
  type AnalyticsQuery,
  type FilterQuery,
} from "@/features/analytics/types/analytics.types";
export const analyticsKeys = {
  all: ["analytics"] as const,
  viewer: (viewerId: string) => ["analytics", viewerId] as const,
  getDashboard: (viewerId: string, query: AnalyticsQuery) =>
    ["analytics", viewerId, "getDashboard", query] as const,
  getDeadlineRisks: (viewerId: string, query: AnalyticsQuery) =>
    ["analytics", viewerId, "getDeadlineRisks", query] as const,
  getWorkload: (viewerId: string, query: AnalyticsQuery) =>
    ["analytics", viewerId, "getWorkload", query] as const,
  getBottlenecks: (viewerId: string, query: AnalyticsQuery) =>
    ["analytics", viewerId, "getBottlenecks", query] as const,
  getAnalysisSummary: (viewerId: string, query: AnalyticsQuery) =>
    ["analytics", viewerId, "getAnalysisSummary", query] as const,
  getAnalysisJob: (viewerId: string, jobId: string) =>
    ["analytics", viewerId, "getAnalysisJob", jobId] as const,
  getAnalysisDetail: (viewerId: string, analysisId: string) =>
    ["analytics", viewerId, "getAnalysisDetail", analysisId] as const,
  listAnalyticsFilterOptions: (viewerId: string, query: FilterQuery) =>
    ["analytics", viewerId, "listAnalyticsFilterOptions", query] as const,
};
