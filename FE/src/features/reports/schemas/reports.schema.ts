import { taskStatusSchema } from "@/features/tasks/schemas/task.schema";
import {
  listQuerySchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const periodTypeSchema = z.enum(["DAILY", "WEEKLY"]);
export const createReportSchema = z
  .object({
    projectId: idSchema,
    periodType: periodTypeSchema,
    periodStart: z.iso.date(),
    achievements: z.string().trim().max(10000).optional(),
    blockers: z.string().trim().max(10000).optional(),
    nextPlan: z.string().trim().max(10000).optional(),
    selectedTaskIds: z.array(idSchema).optional(),
  })
  .strict();
export const reportItemSchema = z.object({
  taskId: idSchema,
  title: z.string(),
  status: taskStatusSchema,
  minutes: z.number().int().safe().min(0),
});
export const reportQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    projectId: idSchema.optional(),
    authorId: idSchema.optional(),
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
    selectedTaskIds: z.array(idSchema).optional(),
    zeroTimeReason: z.string().trim().nullable().optional(),
  })
  .strict();
export const reportPreviewQuerySchema = z
  .object({
    projectId: idSchema,
    periodType: periodTypeSchema,
    periodStart: z.iso.date(),
  })
  .strict();
export const reportPreviewSchema = z.object({
  dataAsOf: z.iso.datetime(),
  totalMinutes: z.number().int().safe().min(0),
  items: z.array(reportItemSchema),
  partialPeriod: z.boolean(),
});
export const reportSchema = z
  .object({
    id: idSchema,
    version: z.number().int().safe().positive(),
    projectId: idSchema,
    periodType: periodTypeSchema,
    periodStart: z.iso.date(),
    authorId: idSchema,
    status: z.enum(["DRAFT", "SUBMITTED"]),
    achievements: z.string().max(10000),
    blockers: z.string().max(10000),
    nextPlan: z.string().max(10000),
    selectedTaskIds: z.array(idSchema),
    zeroTimeReason: z.string().nullable(),
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

export const reportRowSchema = z
  .object(reportSchema.shape)
  .pick({
    id: true,
    projectId: true,
    periodType: true,
    periodStart: true,
    status: true,
    author: true,
  })
  .extend({ totalMinutes: z.number().int().min(0).nullable() });
