import {
  entityLabelSchema,
  listQuerySchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const prioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export const taskStatusSchema = z.enum([
  "NEW",
  "TODO",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "COMPLETED",
  "CANCELLED",
]);
export const taskQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    projectId: idSchema.optional(),
    assigneeId: idSchema.optional(),
    status: taskStatusSchema.optional(),
    priority: prioritySchema.optional(),
    overdue: z.boolean().optional(),
    dueFrom: z.iso.datetime().optional(),
    dueTo: z.iso.datetime().optional(),
    sort: z
      .enum(["dueAt", "-dueAt", "updatedAt", "-updatedAt"])
      .optional()
      .default("dueAt"),
  })
  .strict();
export const taskSchema = z
  .object({
    id: idSchema,
    version: z.number().int().safe().positive(),
    projectId: idSchema,
    title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    description: z.string().nullable(),
    acceptanceCriteria: z
      .string()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    priority: prioritySchema,
    dueAt: z.iso.datetime(),
    originalDueAt: z.iso.datetime(),
    estimatedMinutes: z.number().int().safe().positive(),
    originalEstimatedMinutes: z.number().int().safe().positive(),
    remainingMinutes: z.number().int().safe().nullable(),
    assigneeId: idSchema.nullable(),
    status: taskStatusSchema,
    actualMinutes: z.number().int().safe().min(0),
    latestSubmissionId: idSchema.nullable(),
    isOverdue: z.boolean(),
    assignee: personRefSchema.nullable(),
    project: entityLabelSchema,
  })
  .superRefine(checkProjection);
export const taskHistoryQuerySchema = z
  .object({ ...listQuerySchema.shape })
  .strict();

export const taskRowSchema = z.object(taskSchema.shape).pick({
  id: true,
  title: true,
  status: true,
  priority: true,
  dueAt: true,
  isOverdue: true,
  project: true,
  assignee: true,
});
