// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./analytics.contract";
export const analyticsKeys = {
  all: ["analytics"] as const,
  viewer: (viewerId: string) => ["analytics", viewerId] as const,
  getDashboard: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getDashboard",
      params,
      normalizeQuery(contracts.getDashboardContract.query.parse(query)),
    ] as const,
  getDeadlineRisks: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getDeadlineRisks",
      params,
      normalizeQuery(contracts.getDeadlineRisksContract.query.parse(query)),
    ] as const,
  getWorkload: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getWorkload",
      params,
      normalizeQuery(contracts.getWorkloadContract.query.parse(query)),
    ] as const,
  getBottlenecks: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getBottlenecks",
      params,
      normalizeQuery(contracts.getBottlenecksContract.query.parse(query)),
    ] as const,
  getAnalysisSummary: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getAnalysisSummary",
      params,
      normalizeQuery(contracts.getAnalysisSummaryContract.query.parse(query)),
    ] as const,
  getAnalysisJob: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getAnalysisJob",
      params,
      normalizeQuery(contracts.getAnalysisJobContract.query.parse(query)),
    ] as const,
  getAnalysisDetail: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "getAnalysisDetail",
      params,
      normalizeQuery(contracts.getAnalysisDetailContract.query.parse(query)),
    ] as const,
  listAnalyticsFilterOptions: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "analytics",
      viewerId,
      "listAnalyticsFilterOptions",
      params,
      normalizeQuery(
        contracts.listAnalyticsFilterOptionsContract.query.parse(query),
      ),
    ] as const,
};
