import { jobErrorSchema } from "@/features/analytics/schemas/analysis-job.schema";
import { domainActionSchema } from "@/lib/validation/common.schema";
import { z } from "zod";
export const evidenceSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  sourceType: z.enum([
    "TASK",
    "TIME_LOG",
    "SUBMISSION",
    "REPORT",
    "HISTORY",
    "AGGREGATE",
  ]),
  sourceId: z.string().nullable(),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(1000),
  observedAt: z.iso.datetime().nullable(),
  action: domainActionSchema.nullable(),
});
export const findingSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  text: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(3000),
  metricIds: z.array(z.string()),
  evidenceIds: z.array(z.string()),
});
export const recommendationSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  text: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]),
  evidenceIds: z.array(z.string()),
  action: domainActionSchema.nullable(),
});
export const llmExplanationSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  locale: z.enum(["vi-VN"]),
  generatedAt: z.iso.datetime(),
  modelDisplayName: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(255),
  promptVersion: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  summary: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(4000),
  findings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  limitations: z.array(z.string()),
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
  activeJobId: z.string().nullable(),
  error: jobErrorSchema.nullable(),
});
