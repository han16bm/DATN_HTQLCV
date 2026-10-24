"use client";
import { filterQuerySchema } from "@/features/analytics/schemas/analytics-query.schema";
import {
  type AnalyticsQuery,
  type FilterQuery,
} from "@/features/analytics/types/analytics.types";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { idSchema } from "@/lib/validation/request.schema";
import { ApiError } from "@/types/api/error";
import { useQuery } from "@tanstack/react-query";
import { analyticsKeys } from "../api/analytics.keys";
import { analyticsService } from "../api/analytics.service";

export function useGetDashboardQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getDashboard(
      session?.user.id ?? "anonymous",
      query,
    ),
    queryFn: ({ signal }) => analyticsService.getDashboard(query, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      hasPermission(session, "ANALYTICS_VIEW", query.projectId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}
export function useGetDeadlineRisksQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getDeadlineRisks(
      session?.user.id ?? "anonymous",
      query,
    ),
    queryFn: ({ signal }) =>
      analyticsService.getDeadlineRisks(query, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      hasPermission(session, "ANALYTICS_VIEW", query.projectId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}
export function useGetWorkloadQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getWorkload(session?.user.id ?? "anonymous", query),
    queryFn: ({ signal }) => analyticsService.getWorkload(query, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      hasPermission(session, "ANALYTICS_VIEW", query.projectId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}
export function useGetBottlenecksQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getBottlenecks(
      session?.user.id ?? "anonymous",
      query,
    ),
    queryFn: ({ signal }) => analyticsService.getBottlenecks(query, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      hasPermission(session, "ANALYTICS_VIEW", query.projectId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}
export function useGetAnalysisSummaryQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getAnalysisSummary(
      session?.user.id ?? "anonymous",
      query,
    ),
    queryFn: ({ signal }) =>
      analyticsService.getAnalysisSummary(query, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      hasPermission(session, "ANALYTICS_VIEW", query.projectId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}
export function useGetAnalysisJobQuery(
  jobId: string,
  options: QueryOptions & { poll?: number | false } = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getAnalysisJob(
      session?.user.id ?? "anonymous",
      jobId,
    ),
    queryFn: ({ signal }) => analyticsService.getAnalysisJob(jobId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(jobId).success &&
      hasPermission(session, "ANALYTICS_VIEW"),
    staleTime: 10000,
    refetchInterval: (current) => {
      if (
        current.state.error instanceof ApiError &&
        [401, 403, 410].includes(current.state.error.status)
      )
        return false;
      const job = current.state.data;
      if (
        !options.poll ||
        (job && ["SUCCEEDED", "FAILED"].includes(job.status))
      )
        return false;
      return job
        ? Math.max(2000, Math.min(10000, job.pollAfterMs))
        : options.poll;
    },
  });
  return useQueryAccess(result, "analytics");
}
export function useGetAnalysisDetailQuery(
  analysisId: string,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: analyticsKeys.getAnalysisDetail(
      session?.user.id ?? "anonymous",
      analysisId,
    ),
    queryFn: ({ signal }) =>
      analyticsService.getAnalysisDetail(analysisId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(analysisId).success &&
      hasPermission(session, "ANALYTICS_VIEW"),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}
export function useListAnalyticsFilterOptionsQuery(
  query: FilterQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = filterQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? analyticsKeys.listAnalyticsFilterOptions(
          session?.user.id ?? "anonymous",
          filters,
        )
      : [
          "analytics",
          session?.user.id ?? "anonymous",
          "listAnalyticsFilterOptions",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      analyticsService.listAnalyticsFilterOptions(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "analytics");
}
