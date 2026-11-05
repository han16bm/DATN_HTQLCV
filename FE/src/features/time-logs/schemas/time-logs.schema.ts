import { taskSchema } from "@/features/tasks/schemas/task.schema";
import {
  listQuerySchema,
  personRefSchema,
  reasonSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const createTimeLogSchema = z
  .object({
    workDate: z.iso.date(),
    minutes: z.number().int().safe().max(1440).positive(),
    description: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const updateTimeLogSchema = createTimeLogSchema
  .partial()
  .extend({ reason: reasonSchema.shape.reason });
export const timeLogSchema = z
  .object({
    id: idSchema,
    version: z.number().int().safe().positive(),
    userId: idSchema,
    workDate: z.iso.date(),
    minutes: z.number().int().safe().max(1440).positive(),
    description: z
      .string()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    status: z.enum(["ACTIVE", "VOID"]),
    voidReason: z.string().nullable(),
    user: personRefSchema,
  })
  .superRefine(checkProjection);
export const timeLogQuerySchema = z
  .object({ ...listQuerySchema.shape })
  .strict();
export const timeLogChangeResultSchema = z.object({
  timeLog: timeLogSchema,
  task: taskSchema,
});
