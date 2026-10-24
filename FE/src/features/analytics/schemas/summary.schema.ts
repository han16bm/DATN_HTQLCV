import { analysisMetaSchema } from "@/features/analytics/schemas/analysis-meta.schema";
import { measureSchema } from "@/features/analytics/schemas/analysis-snapshot.schema";
import { analysisRefSchema } from "@/lib/validation/common.schema";
import { z } from "zod";
export const highlightSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  description: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  severity: z.enum(["INFO", "MEDIUM", "HIGH"]),
  analysisRef: analysisRefSchema,
});
export const summarySchema = z.object({
  metadata: analysisMetaSchema,
  overviewRef: analysisRefSchema,
  metrics: z.array(
    measureSchema.pick({ label: true, value: true, unit: true, formula: true }),
  ),
  highlights: z.array(highlightSchema),
  summaryText: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(4000),
});
