// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./reports.contract";
export const reportsKeys = {
  all: ["reports"] as const,
  viewer: (viewerId: string) => ["reports", viewerId] as const,
  listReports: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "reports",
      viewerId,
      "listReports",
      params,
      normalizeQuery(contracts.listReportsContract.query.parse(query)),
    ] as const,
  getReportPreview: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "reports",
      viewerId,
      "getReportPreview",
      params,
      normalizeQuery(contracts.getReportPreviewContract.query.parse(query)),
    ] as const,
  getReport: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "reports",
      viewerId,
      "getReport",
      params,
      normalizeQuery(contracts.getReportContract.query.parse(query)),
    ] as const,
};
