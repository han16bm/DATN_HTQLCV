import type { ViewerId } from "@/types/common";
import {
  type ReportPreviewQuery,
  type ReportQuery,
} from "../types/reports.types";
export const reportsKeys = {
  all: ["reports"] as const,
  viewer: (viewerId: ViewerId) => ["reports", viewerId ?? "anonymous"] as const,
  listReports: (viewerId: ViewerId, query: ReportQuery) =>
    [...reportsKeys.viewer(viewerId), "listReports", query] as const,
  getReportPreview: (viewerId: ViewerId, query: ReportPreviewQuery) =>
    [...reportsKeys.viewer(viewerId), "getReportPreview", query] as const,
  getReport: (viewerId: ViewerId, reportId: string) =>
    [...reportsKeys.viewer(viewerId), "getReport", reportId] as const,
};
