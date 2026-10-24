import { prioritySchema } from "@/features/tasks/schemas/task.schema";
import { z } from "zod";
export const assignTaskSchema = z
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
export const remainingSchema = z
  .object({
    remainingMinutes: z.number().int().safe().min(0).max(5256000),
  })
  .strict();
export const createTaskSchema = z
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
    priority: prioritySchema,
    dueAt: z.iso.datetime(),
    estimatedMinutes: z.number().int().safe().max(5256000).positive(),
  })
  .strict();
export const updateTaskSchema = z
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
    priority: prioritySchema.optional(),
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
