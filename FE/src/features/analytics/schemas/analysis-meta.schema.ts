import { analyticsQuerySchema } from "@/features/analytics/schemas/analytics-query.schema";
import { z } from "zod";
export const qualitySchema = z.object({
  status: z.enum(["SUFFICIENT", "PARTIAL", "INSUFFICIENT"]),
  missingFields: z.array(z.string()),
  scopeLimited: z.boolean(),
});
export const analysisMetaSchema = z.object({
  snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  dataAsOf: z.iso.datetime(),
  generatedAt: z.iso.datetime(),
  scope: analyticsQuerySchema,
  calculationMethod: z.enum(["SERVER_RULES"]),
  calculationVersion: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(100),
  quality: qualitySchema,
});
