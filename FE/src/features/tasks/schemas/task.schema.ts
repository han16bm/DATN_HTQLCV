import {
  entityLabelSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
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
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    assigneeId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
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
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
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
    assigneeId: z.string().nullable(),
    status: taskStatusSchema,
    statusChangedAt: z.iso.datetime(),
    firstStartedAt: z.iso.datetime().nullable(),
    completedAt: z.iso.datetime().nullable(),
    cancelledAt: z.iso.datetime().nullable(),
    actualMinutes: z.number().int().safe().min(0),
    latestSubmissionId: z.string().nullable(),
    isOverdue: z.boolean(),
    assignee: personRefSchema.nullable(),
    project: entityLabelSchema,
  })
  .superRefine(checkProjection);
export const taskHistoryQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
  })
  .strict();
