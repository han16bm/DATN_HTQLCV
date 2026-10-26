"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { reportsKeys } from "../api/reports.keys";
import { reportsService } from "../api/reports.service";
import {
  reportPreviewQuerySchema,
  reportQuerySchema,
} from "../schemas/reports.schema";
import {
  type ReportPreviewQuery,
  type ReportQuery,
} from "../types/reports.types";

export function useListReportsQuery(query: ReportQuery = {}) {
  const viewerId = useSession().session?.user.id;

  const filters = reportQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: reportsKeys.listReports(viewerId, filters),
    queryFn: ({ signal }) => reportsService.listReports(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "reports");
}

export function useGetReportPreviewQuery(query: ReportPreviewQuery) {
  const viewerId = useSession().session?.user.id;

  const filters = reportPreviewQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: reportsKeys.getReportPreview(viewerId, filters),
    queryFn: ({ signal }) =>
      reportsService.getReportPreview(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "reports");
}

export function useGetReportQuery(reportId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: reportsKeys.getReport(viewerId, reportId),
    queryFn: ({ signal }) => reportsService.getReport(reportId, { signal }),
    enabled: Boolean(viewerId && reportId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "reports");
}
