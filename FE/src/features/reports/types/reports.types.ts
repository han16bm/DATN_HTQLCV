import type {
  createReportSchema,
  reportPreviewQuerySchema,
  reportPreviewSchema,
  reportQuerySchema,
  reportSchema,
  reportSubmitSchema,
  updateReportSchema,
} from "@/features/reports/schemas/reports.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
export type ReportPreviewDto = z.output<typeof reportPreviewSchema>;
export type ReportDto = z.output<typeof reportSchema>;
export type ReportQuery = z.input<typeof reportQuerySchema>;
export type ReportList = Page<ReportDto>;
export type GetReportPreviewQuery = z.input<typeof reportPreviewQuerySchema>;
export type CreateReportDraftInput = z.input<typeof createReportSchema>;
export type UpdateReportDraftInput = z.input<typeof updateReportSchema>;
export type UpdateReportDraftArgs = {
  reportId: string;
  payload: UpdateReportDraftInput;
  version: number;
};
export type RefreshReportDraftArgs = { reportId: string; version: number };
export type SubmitReportInput = z.input<typeof reportSubmitSchema>;
export type SubmitReportArgs = {
  reportId: string;
  payload: SubmitReportInput;
  version: number;
};
