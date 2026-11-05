import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import {
  reportPreviewSchema,
  reportRowSchema,
  reportSchema,
} from "../schemas/reports.schema";
import type {
  CreateReportDraftInput,
  ReportDto,
  ReportList,
  ReportPreviewDto,
  ReportPreviewQuery,
  ReportQuery,
  SubmitReportInput,
  UpdateReportDraftInput,
} from "../types/reports.types";

export const reportsService = {
  async listReports(query: ReportQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<ReportList>("/reports", {
      ...options,
      params: query,
      schema: page(reportRowSchema),
    });
    return response.data;
  },

  async getReportPreview(
    query: ReportPreviewQuery,
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<ReportPreviewDto>("/report-previews", {
      ...options,
      params: query,
      schema: reportPreviewSchema,
    });
    return response.data;
  },

  async getReport(reportId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<ReportDto>(
      `/reports/${encodeURIComponent(reportId)}`,
      { ...options, schema: reportSchema },
    );
    return response.data;
  },

  async createReportDraft(
    payload: CreateReportDraftInput,
    options: MutationOptions,
  ) {
    const response = await apiClient.post<ReportDto>("/reports", payload, {
      ...options,
      schema: reportSchema,
    });
    return response.data;
  },

  async updateReportDraft(
    reportId: string,
    payload: UpdateReportDraftInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<ReportDto>(
      `/reports/${encodeURIComponent(reportId)}`,
      payload,
      { ...options, schema: reportSchema },
    );
    return response.data;
  },

  async refreshReportDraft(reportId: string, options: VersionOptions) {
    const response = await apiClient.post<ReportPreviewDto>(
      `/reports/${encodeURIComponent(reportId)}/refresh`,
      {},
      { ...options, schema: reportPreviewSchema },
    );
    return response.data;
  },

  async submitReport(
    reportId: string,
    payload: SubmitReportInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<ReportDto>(
      `/reports/${encodeURIComponent(reportId)}/submit`,
      payload,
      { ...options, schema: reportSchema },
    );
    return response.data;
  },
};
