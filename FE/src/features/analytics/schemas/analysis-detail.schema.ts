import { checkAnalysisDetail } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { explanationStateSchema } from "./analysis-explanation.schema";
import { feedbackSchema } from "./analysis-feedback.schema";
import { explanationRatingStateSchema } from "./analysis-rating.schema";
import { analysisSnapshotSchema } from "./analysis-snapshot.schema";
const freshnessSchema = z.object({
  status: z.enum(["CURRENT", "OUTDATED"]),
  latestAnalysisId: idSchema.nullable(),
});
const generationPolicySchema = z.object({
  allowed: z.boolean(),
  blockedReason: z
    .enum([
      "SNAPSHOT_OUTDATED",
      "INSUFFICIENT_DATA",
      "LLM_NOT_CONFIGURED",
      "ACTIVE_JOB",
      "RATE_LIMITED",
    ])
    .nullable()
    .default(null),
  retryAfterSeconds: z.number().int().safe().min(0).nullable().default(null),
});
export const analysisSchema = z
  .object({
    snapshot: analysisSnapshotSchema,
    freshness: freshnessSchema,
    explanation: explanationStateSchema,
    generation: generationPolicySchema,
    systemSummary: z
      .string()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(4000),
    feedback: z.object({
      latest: feedbackSchema.nullable(),
      canSubmit: z.boolean(),
    }),
    explanationRating: explanationRatingStateSchema,
  })
  .superRefine(checkAnalysisDetail);
