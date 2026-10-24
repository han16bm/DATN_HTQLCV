// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/reports.contract";
import { reportsService } from "../api/reports.service";
import { reportsKeys } from "../api/reports.keys";
export function useListReportsQuery(
  request: ContractRequest<typeof contracts.listReportsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listReportsContract,
    request,
    reportsService.listReports,
    reportsKeys.listReports,
    options,
  );
}
export function useGetReportPreviewQuery(
  request: ContractRequest<typeof contracts.getReportPreviewContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getReportPreviewContract,
    request,
    reportsService.getReportPreview,
    reportsKeys.getReportPreview,
    options,
  );
}
export function useGetReportQuery(
  request: ContractRequest<typeof contracts.getReportContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getReportContract,
    request,
    reportsService.getReport,
    reportsKeys.getReport,
    options,
  );
}
