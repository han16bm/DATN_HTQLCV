import type { ReportsApi } from "@/features/reports/api/reports.contract";
import {
  reportPreviewSchema,
  reportSchema,
} from "@/features/reports/schemas/reports.schema";
import {
  type CreateReportDraftInput,
  type GetReportPreviewQuery,
  type ReportQuery,
  type SubmitReportInput,
  type UpdateReportDraftInput,
} from "@/features/reports/types/reports.types";
import { page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export const reportsService: ReportsApi = {
  listReports(query: ReportQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/reports`, page(reportSchema), {
      ...options,
      query,
    });
  },
  getReportPreview(query: GetReportPreviewQuery, options: RequestOptions = {}) {
    return apiClient.get(`/report-previews`, reportPreviewSchema, {
      ...options,
      query,
    });
  },
  getReport(reportId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/reports/${encodeURIComponent(reportId)}`,
      reportSchema,
      options,
    );
  },
  createReportDraft(payload: CreateReportDraftInput, options: MutationOptions) {
    return apiClient.post(`/reports`, payload, reportSchema, options);
  },
  updateReportDraft(
    reportId: string,
    payload: UpdateReportDraftInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/reports/${encodeURIComponent(reportId)}`,
      payload,
      reportSchema,
      options,
    );
  },
  refreshReportDraft(reportId: string, options: VersionOptions) {
    return apiClient.post(
      `/reports/${encodeURIComponent(reportId)}/refresh`,
      {},
      reportPreviewSchema,
      options,
    );
  },
  submitReport(
    reportId: string,
    payload: SubmitReportInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/reports/${encodeURIComponent(reportId)}/submit`,
      payload,
      reportSchema,
      options,
    );
  },
};
