import { taskStatusSchema } from "@/features/tasks/schemas/task.schema";
import { personRefSchema } from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const periodTypeSchema = z.enum(["DAILY", "WEEKLY"]);
export const createReportSchema = z
  .object({
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    periodType: periodTypeSchema,
    periodStart: z.iso.date(),
    achievements: z.string().trim().max(10000).optional(),
    blockers: z.string().trim().max(10000).optional(),
    nextPlan: z.string().trim().max(10000).optional(),
    selectedTaskIds: z.array(z.string().trim()).optional(),
  })
  .strict();
export const reportItemSchema = z.object({
  taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string(),
  status: taskStatusSchema,
  minutes: z.number().int().safe().min(0),
});
export const reportQuerySchema = z
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
    periodType: periodTypeSchema.optional(),
    status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .strict();
export const updateReportSchema = z
  .object({
    achievements: z.string().trim().max(10000).optional(),
    blockers: z.string().trim().max(10000).optional(),
    nextPlan: z.string().trim().max(10000).optional(),
    selectedTaskIds: z.array(z.string().trim()).optional(),
    zeroTimeReason: z.string().trim().nullable().optional(),
  })
  .strict();
export const reportPreviewQuerySchema = z
  .object({
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    periodType: periodTypeSchema,
    periodStart: z.iso.date(),
  })
  .strict();
export const reportPreviewSchema = z.object({
  projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  periodType: periodTypeSchema,
  periodStart: z.iso.date(),
  periodEndExclusive: z.iso.datetime(),
  dataAsOf: z.iso.datetime(),
  totalMinutes: z.number().int().safe().min(0),
  items: z.array(reportItemSchema),
  partialPeriod: z.boolean(),
});
export const reportSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    periodType: periodTypeSchema,
    periodStart: z.iso.date(),
    authorId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    status: z.enum(["DRAFT", "SUBMITTED"]),
    achievements: z.string().max(10000),
    blockers: z.string().max(10000),
    nextPlan: z.string().max(10000),
    selectedTaskIds: z.array(z.string()),
    zeroTimeReason: z.string().nullable(),
    submittedAt: z.iso.datetime().nullable(),
    snapshot: reportPreviewSchema.nullable(),
    author: personRefSchema,
  })
  .superRefine(checkProjection);
export const reportSubmitSchema = z
  .object({
    zeroTimeReason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
