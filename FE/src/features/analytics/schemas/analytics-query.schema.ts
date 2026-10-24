import {
  prioritySchema,
  taskStatusSchema,
} from "@/features/tasks/schemas/task.schema";
import { z } from "zod";
export const analyticsQuerySchema = z
  .object({
    unitId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    ownerId: z
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
    from: z.iso.date(),
    to: z.iso.date(),
    teamId: z.string().trim().optional(),
  })
  .strict();
export const filterQuerySchema = z
  .object({
    kind: z.enum(["UNIT", "PROJECT", "TEAM", "PERSON"]),
    q: z.string().trim().max(255).optional(),
    unitId: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    teamId: z.string().min(1).optional(),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(20),
  })
  .strict();
