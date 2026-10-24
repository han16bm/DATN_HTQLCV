import type { ReportsApi } from "@/features/reports/api/reports.contract";
import {
  reportPreviewSchema,
  reportRowSchema,
  reportSchema,
} from "@/features/reports/schemas/reports.schema";
import {
  type CreateReportDraftInput,
  type ReportPreviewQuery,
  type ReportQuery,
  type SubmitReportInput,
  type UpdateReportDraftInput,
} from "@/features/reports/types/reports.types";
import { page } from "@/lib/validation/common.schema";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const reportsService: ReportsApi = {
  listReports(query: ReportQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/reports", { ...options, params: query })
      .then(parseResponse(page(reportRowSchema)));
  },
  getReportPreview(query: ReportPreviewQuery, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/report-previews", { ...options, params: query })
      .then(parseResponse(reportPreviewSchema));
  },
  getReport(reportId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/reports/${encodeURIComponent(reportId)}`, options)
      .then(parseResponse(reportSchema));
  },
  createReportDraft(payload: CreateReportDraftInput, options: MutationOptions) {
    return apiClient
      .post<unknown>("/reports", payload, options)
      .then(parseResponse(reportSchema));
  },
  updateReportDraft(
    reportId: string,
    payload: UpdateReportDraftInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(
        `/reports/${encodeURIComponent(reportId)}`,
        payload,
        options,
      )
      .then(parseResponse(reportSchema));
  },
  refreshReportDraft(reportId: string, options: VersionOptions) {
    return apiClient
      .post<unknown>(
        `/reports/${encodeURIComponent(reportId)}/refresh`,
        {},
        options,
      )
      .then(parseResponse(reportPreviewSchema));
  },
  submitReport(
    reportId: string,
    payload: SubmitReportInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/reports/${encodeURIComponent(reportId)}/submit`,
        payload,
        options,
      )
      .then(parseResponse(reportSchema));
  },
};
