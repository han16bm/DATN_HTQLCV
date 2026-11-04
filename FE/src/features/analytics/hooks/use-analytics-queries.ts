"use client";

import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { ApiError } from "@/types/api/error";
import { useQuery } from "@tanstack/react-query";
import { analyticsKeys } from "../api/analytics.keys";
import { analyticsService } from "../api/analytics.service";
import { filterOptionsQuerySchema } from "../schemas/analytics-query.schema";
import {
  type AnalyticsQuery,
  type FilterOptionsQuery,
} from "../types/analytics.types";

export function useGetDashboardQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getDashboard(viewerId, query),
    queryFn: ({ signal }) => analyticsService.getDashboard(query, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}

export function useGetDeadlineRisksQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getDeadlineRisks(viewerId, query),
    queryFn: ({ signal }) =>
      analyticsService.getDeadlineRisks(query, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}

export function useGetWorkloadQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getWorkload(viewerId, query),
    queryFn: ({ signal }) => analyticsService.getWorkload(query, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}

export function useGetBottlenecksQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getBottlenecks(viewerId, query),
    queryFn: ({ signal }) => analyticsService.getBottlenecks(query, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}

export function useGetAnalysisSummaryQuery(
  query: AnalyticsQuery,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getAnalysisSummary(viewerId, query),
    queryFn: ({ signal }) =>
      analyticsService.getAnalysisSummary(query, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}

export function useGetAnalysisJobQuery(
  jobId: string,
  options: QueryOptions & { poll?: number | false } = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getAnalysisJob(viewerId, jobId),
    queryFn: ({ signal }) => analyticsService.getAnalysisJob(jobId, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId && jobId),
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

export function useGetAnalysisDetailQuery(analysisId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: analyticsKeys.getAnalysisDetail(viewerId, analysisId),
    queryFn: ({ signal }) =>
      analyticsService.getAnalysisDetail(analysisId, { signal }),
    enabled: Boolean(viewerId && analysisId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "analytics");
}

export function useListAnalyticsFilterOptionsQuery(
  query: FilterOptionsQuery,
  enabled = true,
) {
  const viewerId = useSession().session?.user.id;

  const filters = filterOptionsQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: analyticsKeys.listAnalyticsFilterOptions(viewerId, filters),
    queryFn: ({ signal }) =>
      analyticsService.listAnalyticsFilterOptions(filters, { signal }),
    enabled: Boolean(viewerId) && enabled,
    staleTime: 30000,
  });
  return useQueryAccess(result, "analytics");
}
