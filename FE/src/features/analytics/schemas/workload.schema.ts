import { analysisMetaSchema } from "@/features/analytics/schemas/analysis-meta.schema";
import {
  analysisRefSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const workloadSchema = z.object({
  metadata: analysisMetaSchema,
  items: z.array(
    z.object({
      userId: idSchema,
      openTaskCount: z.number().int().safe().min(0),
      pendingReviewCount: z.number().int().safe().min(0),
      originalEstimateMinutes: z.number().int().safe().min(0),
      currentEstimateMinutes: z.number().int().safe().min(0),
      remainingMinutes: z.number().int().safe().nullable(),
      capacityMinutes: z.number().int().safe().nullable(),
      utilizationRate: z.number().finite().nullable(),
      person: personRefSchema,
      analysisRef: analysisRefSchema,
    }),
  ),
});
