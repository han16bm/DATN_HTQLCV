import {
  type CreateReportDraftInput,
  type ReportDto,
  type ReportList,
  type ReportPreviewDto,
  type ReportPreviewQuery,
  type ReportQuery,
  type SubmitReportInput,
  type UpdateReportDraftInput,
} from "@/features/reports/types/reports.types";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
export interface ReportsApi {
  listReports(
    query?: ReportQuery,
    options?: RequestOptions,
  ): Promise<ReportList>;
  getReportPreview(
    query: ReportPreviewQuery,
    options?: RequestOptions,
  ): Promise<ReportPreviewDto>;
  getReport(reportId: string, options?: RequestOptions): Promise<ReportDto>;
  createReportDraft(
    payload: CreateReportDraftInput,
    options: MutationOptions,
  ): Promise<ReportDto>;
  updateReportDraft(
    reportId: string,
    payload: UpdateReportDraftInput,
    options: VersionOptions,
  ): Promise<ReportDto>;
  refreshReportDraft(
    reportId: string,
    options: VersionOptions,
  ): Promise<ReportPreviewDto>;
  submitReport(
    reportId: string,
    payload: SubmitReportInput,
    options: VersionOptions,
  ): Promise<ReportDto>;
}
