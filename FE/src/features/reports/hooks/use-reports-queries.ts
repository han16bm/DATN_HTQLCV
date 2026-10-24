"use client";
import {
  reportPreviewQuerySchema,
  reportQuerySchema,
} from "@/features/reports/schemas/reports.schema";
import {
  type GetReportPreviewQuery,
  type ReportQuery,
} from "@/features/reports/types/reports.types";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { idSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { reportsKeys } from "../api/reports.keys";
import { reportsService } from "../api/reports.service";

export function useListReportsQuery(
  query: ReportQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = reportQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? reportsKeys.listReports(session?.user.id ?? "anonymous", filters)
      : [
          "reports",
          session?.user.id ?? "anonymous",
          "listReports",
          "invalid-query",
        ],
    queryFn: ({ signal }) => reportsService.listReports(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "reports");
}
export function useGetReportPreviewQuery(
  query: GetReportPreviewQuery,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = reportPreviewQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? reportsKeys.getReportPreview(session?.user.id ?? "anonymous", filters)
      : [
          "reports",
          session?.user.id ?? "anonymous",
          "getReportPreview",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      reportsService.getReportPreview(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 10000,
  });
  return useQueryAccess(result, "reports");
}
export function useGetReportQuery(
  reportId: string,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: reportsKeys.getReport(session?.user.id ?? "anonymous", reportId),
    queryFn: ({ signal }) => reportsService.getReport(reportId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(reportId).success,
    staleTime: 10000,
  });
  return useQueryAccess(result, "reports");
}
