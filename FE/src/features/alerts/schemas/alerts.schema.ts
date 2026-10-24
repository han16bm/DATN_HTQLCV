import { analysisRefSchema } from "@/lib/validation/common.schema";
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
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    status: alertStatusSchema.optional(),
    severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  })
  .strict();
export const alertSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  taskId: z.string().nullable(),
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
