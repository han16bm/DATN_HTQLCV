import {
  type ReportPreviewQuery,
  type ReportQuery,
} from "@/features/reports/types/reports.types";
export const reportsKeys = {
  all: ["reports"] as const,
  viewer: (viewerId: string) => ["reports", viewerId] as const,
  listReports: (viewerId: string, query: ReportQuery) =>
    ["reports", viewerId, "listReports", query] as const,
  getReportPreview: (viewerId: string, query: ReportPreviewQuery) =>
    ["reports", viewerId, "getReportPreview", query] as const,
  getReport: (viewerId: string, reportId: string) =>
    ["reports", viewerId, "getReport", reportId] as const,
};
