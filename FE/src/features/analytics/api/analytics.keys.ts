import type { ViewerId } from "@/types/common";
import {
  type AnalyticsQuery,
  type FilterOptionsQuery,
} from "../types/analytics.types";
export const analyticsKeys = {
  all: ["analytics"] as const,
  viewer: (viewerId: ViewerId) =>
    ["analytics", viewerId ?? "anonymous"] as const,
  getDashboard: (viewerId: ViewerId, query: AnalyticsQuery) =>
    [...analyticsKeys.viewer(viewerId), "getDashboard", query] as const,
  getDeadlineRisks: (viewerId: ViewerId, query: AnalyticsQuery) =>
    [...analyticsKeys.viewer(viewerId), "getDeadlineRisks", query] as const,
  getWorkload: (viewerId: ViewerId, query: AnalyticsQuery) =>
    [...analyticsKeys.viewer(viewerId), "getWorkload", query] as const,
  getBottlenecks: (viewerId: ViewerId, query: AnalyticsQuery) =>
    [...analyticsKeys.viewer(viewerId), "getBottlenecks", query] as const,
  getAnalysisSummary: (viewerId: ViewerId, query: AnalyticsQuery) =>
    [...analyticsKeys.viewer(viewerId), "getAnalysisSummary", query] as const,
  getAnalysisJob: (viewerId: ViewerId, jobId: string) =>
    [...analyticsKeys.viewer(viewerId), "getAnalysisJob", jobId] as const,
  getAnalysisDetail: (viewerId: ViewerId, analysisId: string) =>
    [
      ...analyticsKeys.viewer(viewerId),
      "getAnalysisDetail",
      analysisId,
    ] as const,
  listAnalyticsFilterOptions: (viewerId: ViewerId, query: FilterOptionsQuery) =>
    [
      ...analyticsKeys.viewer(viewerId),
      "listAnalyticsFilterOptions",
      query,
    ] as const,
};
