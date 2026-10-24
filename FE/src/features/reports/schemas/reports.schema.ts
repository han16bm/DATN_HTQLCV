// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { TasksTaskStatusSchema } from "@/features/tasks";
import { SharedPersonRefSchema } from "@/types/common";
export const ReportsPeriodTypeSchema = z.enum(["DAILY", "WEEKLY"]);
export type ReportsPeriodTypeDTO = z.output<typeof ReportsPeriodTypeSchema>;

export const ReportsReportCreateSchema = z
  .object({
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    periodType: ReportsPeriodTypeSchema,
    periodStart: z.iso.date(),
    achievements: z.string().trim().max(10000).optional(),
    blockers: z.string().trim().max(10000).optional(),
    nextPlan: z.string().trim().max(10000).optional(),
    selectedTaskIds: z.array(z.string().trim()).optional(),
  })
  .strict();
export type ReportsReportCreateDTO = z.output<typeof ReportsReportCreateSchema>;

export const ReportsReportItemSchema = z.object({
  taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string(),
  status: TasksTaskStatusSchema,
  minutes: z.number().int().safe().min(0).max(1440),
});
export type ReportsReportItemDTO = z.output<typeof ReportsReportItemSchema>;

export const ReportsReportListQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    authorId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    periodType: ReportsPeriodTypeSchema.optional(),
    status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .strict();
export type ReportsReportListQueryDTO = z.output<
  typeof ReportsReportListQuerySchema
>;

export const ReportsReportPatchSchema = z
  .object({
    achievements: z.string().trim().max(10000).optional(),
    blockers: z.string().trim().max(10000).optional(),
    nextPlan: z.string().trim().max(10000).optional(),
    selectedTaskIds: z.array(z.string().trim()).optional(),
    zeroTimeReason: z.string().trim().nullable().optional(),
  })
  .strict();
export type ReportsReportPatchDTO = z.output<typeof ReportsReportPatchSchema>;

export const ReportsReportPreviewQuerySchema = z
  .object({
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    periodType: ReportsPeriodTypeSchema,
    periodStart: z.iso.date(),
  })
  .strict();
export type ReportsReportPreviewQueryDTO = z.output<
  typeof ReportsReportPreviewQuerySchema
>;

export const ReportsReportPreviewSchema = z.object({
  projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  periodType: ReportsPeriodTypeSchema,
  periodStart: z.iso.date(),
  periodEndExclusive: z.iso.datetime(),
  dataAsOf: z.iso.datetime(),
  totalMinutes: z.number().int().safe().min(0),
  items: z.array(ReportsReportItemSchema),
  partialPeriod: z.boolean(),
});
export type ReportsReportPreviewDTO = z.output<
  typeof ReportsReportPreviewSchema
>;

export const ReportsReportSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    periodType: ReportsPeriodTypeSchema,
    periodStart: z.iso.date(),
    authorId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    status: z.enum(["DRAFT", "SUBMITTED"]),
    achievements: z.string().max(10000),
    blockers: z.string().max(10000),
    nextPlan: z.string().max(10000),
    selectedTaskIds: z.array(z.string()),
    zeroTimeReason: z.string().nullable(),
    submittedAt: z.iso.datetime().nullable(),
    snapshot: ReportsReportPreviewSchema.nullable(),
    author: SharedPersonRefSchema,
  })
  .superRefine(checkProjection);
export type ReportsReportDTO = z.output<typeof ReportsReportSchema>;

export const ReportsReportSubmitSchema = z
  .object({
    zeroTimeReason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
export type ReportsReportSubmitDTO = z.output<typeof ReportsReportSubmitSchema>;
