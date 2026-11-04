import {
  listQuerySchema,
  reasonSchema,
  refSchema,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

export const jobStatusSchema = z.enum(["SUCCEEDED", "FAILED", "RUNNING"]);
export const backgroundJobSchema = z.object({
  code: z.string().min(1).max(100),
  version: z.number().int().safe().positive(),
  name: z.string().min(1),
  description: z.string().nullable(),
  isEnabled: z.boolean(),
  intervalMinutes: z.number().int().min(1).max(1440),
  lastRunAt: z.iso.datetime().nullable(),
  nextRunAt: z.iso.datetime().nullable(),
  lastStatus: jobStatusSchema.nullable(),
  updatedAt: z.iso.datetime(),
  updatedBy: refSchema.nullable(),
});
export const updateJobSchema = z
  .object({
    isEnabled: z.boolean().optional(),
    intervalMinutes: z.number().int().min(1).max(1440).optional(),
    reason: reasonSchema.shape.reason.optional(),
  })
  .strict();
export const jobRunQuerySchema = z
  .object({
    page: listQuerySchema.shape.page,
    pageSize: listQuerySchema.shape.pageSize,
    status: jobStatusSchema.optional(),
  })
  .strict();
export const jobRunSchema = z.object({
  id: idSchema,
  jobCode: z.string().min(1),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
  durationMs: z.number().int().min(0).nullable(),
  status: jobStatusSchema,
  trigger: z.enum(["SCHEDULE", "MANUAL"]),
  triggeredBy: refSchema.nullable(),
  summary: z.record(z.string(), z.number()).nullable(),
  error: z.string().nullable(),
});
