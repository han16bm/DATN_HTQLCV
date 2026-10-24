// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { SharedPersonRefSchema, SharedEntityLabelSchema } from "@/types/common";
export const TasksAssignTaskSchema = z
  .object({
    assigneeId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
export type TasksAssignTaskDTO = z.output<typeof TasksAssignTaskSchema>;

export const TasksPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export type TasksPriorityDTO = z.output<typeof TasksPrioritySchema>;

export const TasksRemainingSchema = z
  .object({
    remainingMinutes: z.number().int().safe().min(0).max(5256000),
  })
  .strict();
export type TasksRemainingDTO = z.output<typeof TasksRemainingSchema>;

export const TasksTaskCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(255),
    description: z.string().trim().nullable().optional(),
    acceptanceCriteria: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    priority: TasksPrioritySchema,
    dueAt: z.iso.datetime(),
    estimatedMinutes: z.number().int().safe().max(5256000).positive(),
  })
  .strict();
export type TasksTaskCreateDTO = z.output<typeof TasksTaskCreateSchema>;

export const TasksTaskStatusSchema = z.enum([
  "NEW",
  "TODO",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "COMPLETED",
  "CANCELLED",
]);
export type TasksTaskStatusDTO = z.output<typeof TasksTaskStatusSchema>;

export const TasksTaskListQuerySchema = z
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
    status: TasksTaskStatusSchema.optional(),
    priority: TasksPrioritySchema.optional(),
    overdue: z.boolean().optional(),
    dueFrom: z.iso.datetime().optional(),
    dueTo: z.iso.datetime().optional(),
    sort: z
      .enum(["dueAt", "-dueAt", "updatedAt", "-updatedAt"])
      .optional()
      .default("dueAt"),
  })
  .strict();
export type TasksTaskListQueryDTO = z.output<typeof TasksTaskListQuerySchema>;

export const TasksTaskPatchSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(255)
      .optional(),
    description: z.string().trim().nullable().optional(),
    acceptanceCriteria: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
    priority: TasksPrioritySchema.optional(),
    dueAt: z.iso.datetime().optional(),
    estimatedMinutes: z
      .number()
      .int()
      .safe()
      .max(5256000)
      .positive()
      .optional(),
    changeReason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
export type TasksTaskPatchDTO = z.output<typeof TasksTaskPatchSchema>;

export const TasksTaskSchema = z
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
    priority: TasksPrioritySchema,
    dueAt: z.iso.datetime(),
    originalDueAt: z.iso.datetime(),
    estimatedMinutes: z.number().int().safe().positive(),
    originalEstimatedMinutes: z.number().int().safe().positive(),
    remainingMinutes: z.number().int().safe().nullable(),
    assigneeId: z.string().nullable(),
    status: TasksTaskStatusSchema,
    statusChangedAt: z.iso.datetime(),
    firstStartedAt: z.iso.datetime().nullable(),
    completedAt: z.iso.datetime().nullable(),
    cancelledAt: z.iso.datetime().nullable(),
    actualMinutes: z.number().int().safe().min(0),
    latestSubmissionId: z.string().nullable(),
    isOverdue: z.boolean(),
    assignee: SharedPersonRefSchema.nullable(),
    project: SharedEntityLabelSchema,
  })
  .superRefine(checkProjection);
export type TasksTaskDTO = z.output<typeof TasksTaskSchema>;
