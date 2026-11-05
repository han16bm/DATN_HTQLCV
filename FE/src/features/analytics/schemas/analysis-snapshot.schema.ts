import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { evidenceSchema } from "./analysis-explanation.schema";
import { qualitySchema } from "./analysis-meta.schema";
import { analyticsQuerySchema } from "./analytics-query.schema";
export const measureSchema = z.object({
  id: idSchema,
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  value: z.number().finite().nullable(),
  unit: z.enum(["TASK", "COUNT", "PERCENT", "MINUTE", "HOUR"]),
  formula: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
});
export const contextItemSchema = z.object({
  key: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  value: z.string().nullable(),
  valueType: z.enum(["TEXT", "UTC", "DATE"]),
});
const analysisSeriesSchema = z.object({
  id: idSchema,
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  points: z.array(
    z.object({
      date: z.iso.date(),
      value: z.number().finite().nullable(),
    }),
  ),
});
export const analysisSnapshotSchema = z.object({
  id: idSchema,
  analysisId: idSchema,
  analysisType: z.enum(["RISK", "WORKLOAD", "BOTTLENECK", "SUMMARY", "METRIC"]),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  scope: analyticsQuerySchema.pick({ from: true, to: true }).strip(),
  dataAsOf: z.iso.datetime(),
  quality: qualitySchema,
  metrics: z.array(measureSchema),
  context: z.array(contextItemSchema),
  series: z.array(analysisSeriesSchema),
  evidence: z.array(evidenceSchema),
});
