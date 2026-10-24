import {
  analysisRefSchema,
  listQuerySchema,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const updateAlertSchema = z
  .object({
    status: z.enum(["READ", "IN_PROGRESS", "RESOLVED", "DISMISSED"]),
    resolutionNote: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
export const alertStatusSchema = z.enum([
  "UNREAD",
  "READ",
  "IN_PROGRESS",
  "RESOLVED",
  "DISMISSED",
]);
export const alertQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    projectId: idSchema.optional(),
    status: alertStatusSchema.optional(),
    severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  })
  .strict();
export const alertSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  projectId: idSchema,
  taskId: idSchema.nullable(),
  type: z.enum([
    "DEADLINE_RISK",
    "OVERDUE",
    "WORKLOAD",
    "BOTTLENECK",
    "DATA_QUALITY",
  ]),
  severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: alertStatusSchema,
  conditionActive: z.boolean(),
  evidence: z.array(z.string()),
  dataAsOf: z.iso.datetime(),
  methodVersion: z.string(),
  resolutionNote: z.string().nullable(),
  handledBy: z.string().nullable(),
  handledAt: z.iso.datetime().nullable(),
  taskTitle: z.string().nullable(),
  analysisRef: analysisRefSchema.nullable(),
});

export const alertRowSchema = z.object(alertSchema.shape).pick({
  id: true,
  type: true,
  taskTitle: true,
  severity: true,
  status: true,
  conditionActive: true,
});
