import { domainActionSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { jobErrorSchema } from "./analysis-job.schema";
export const evidenceSchema = z.object({
  id: idSchema,
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(1000),
  observedAt: z.iso.datetime().nullable(),
  action: domainActionSchema.nullable(),
});
const findingSchema = z.object({
  id: idSchema,
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  text: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(3000),
  metricIds: z.array(idSchema),
  evidenceIds: z.array(idSchema),
});
export const recommendationSchema = z.object({
  id: idSchema,
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  text: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  evidenceIds: z.array(idSchema),
  action: domainActionSchema.nullable(),
});
export const llmExplanationSchema = z.object({
  analysisId: idSchema,
  snapshotId: idSchema,
  generatedAt: z.iso.datetime(),
  modelDisplayName: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(255),
  summary: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(4000),
  findings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  limitations: z.array(z.string()),
  promptVersion: z.string().max(100).optional(),
});
export const explanationStateSchema = z.object({
  status: z.enum([
    "NOT_REQUESTED",
    "QUEUED",
    "RUNNING",
    "READY",
    "FAILED",
    "UNAVAILABLE",
  ]),
  lastSuccess: llmExplanationSchema.nullable(),
  activeJobId: idSchema.nullable(),
  error: jobErrorSchema.nullable(),
});
