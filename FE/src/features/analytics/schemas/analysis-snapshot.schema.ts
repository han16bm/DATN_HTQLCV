import { evidenceSchema } from "@/features/analytics/schemas/analysis-explanation.schema";
import { qualitySchema } from "@/features/analytics/schemas/analysis-meta.schema";
import { analyticsQuerySchema } from "@/features/analytics/schemas/analytics-query.schema";
import { analysisSubjectSchema } from "@/lib/validation/common.schema";
import { z } from "zod";
export const measureSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  code: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  value: z.number().finite().nullable(),
  unit: z.enum(["TASK", "COUNT", "PERCENT", "MINUTE", "HOUR"]),
  basis: z.enum(["CURRENT", "PERIOD"]),
  formula: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  evidenceIds: z.array(z.string()),
  missingFields: z.array(z.string()),
});
export const contextItemSchema = z.object({
  key: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  value: z.string().nullable(),
  valueType: z.enum(["TEXT", "UTC", "DATE"]),
});
export const analysisSeriesSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  unit: z.enum(["TASK", "COUNT", "PERCENT", "MINUTE", "HOUR"]),
  points: z.array(
    z.object({
      date: z.iso.date(),
      value: z.number().finite().nullable(),
    }),
  ),
});
export const analysisSnapshotSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  sourceRevision: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(255),
  analysisType: z.enum(["RISK", "WORKLOAD", "BOTTLENECK", "SUMMARY", "METRIC"]),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  subject: analysisSubjectSchema,
  scope: analyticsQuerySchema,
  dataAsOf: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  calculationVersion: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(100),
  quality: qualitySchema,
  metrics: z.array(measureSchema),
  context: z.array(contextItemSchema),
  series: z.array(analysisSeriesSchema),
  evidence: z.array(evidenceSchema),
});
