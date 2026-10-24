// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { SharedPersonRefSchema } from "@/types/common";
export const LogsTimeLogCreateSchema = z
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
export type LogsTimeLogCreateDTO = z.output<typeof LogsTimeLogCreateSchema>;

export const LogsTimeLogPatchSchema = z
  .object({
    workDate: z.iso.date().optional(),
    minutes: z.number().int().safe().max(1440).positive().optional(),
    description: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export type LogsTimeLogPatchDTO = z.output<typeof LogsTimeLogPatchSchema>;

export const LogsTimeLogSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    userId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    workDate: z.iso.date(),
    minutes: z.number().int().safe().max(1440).positive(),
    description: z
      .string()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    status: z.enum(["ACTIVE", "VOID"]),
    voidReason: z.string().nullable(),
    user: SharedPersonRefSchema,
  })
  .superRefine(checkProjection);
export type LogsTimeLogDTO = z.output<typeof LogsTimeLogSchema>;
