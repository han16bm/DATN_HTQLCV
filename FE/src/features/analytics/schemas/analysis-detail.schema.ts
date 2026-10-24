import { explanationStateSchema } from "@/features/analytics/schemas/analysis-explanation.schema";
import { feedbackSchema } from "@/features/analytics/schemas/analysis-feedback.schema";
import { analysisSnapshotSchema } from "@/features/analytics/schemas/analysis-snapshot.schema";
import { checkAnalysisDetail } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const freshnessSchema = z.object({
  status: z.enum(["CURRENT", "OUTDATED"]),
  checkedAt: z.iso.datetime(),
  latestAnalysisId: z.string().nullable(),
});
export const generationPolicySchema = z.object({
  allowed: z.boolean(),
  blockedReason: z
    .enum([
      "SNAPSHOT_OUTDATED",
      "INSUFFICIENT_DATA",
      "LLM_NOT_CONFIGURED",
      "ACTIVE_JOB",
      "RATE_LIMITED",
    ])
    .nullable(),
  retryAfterSeconds: z.number().int().safe().nullable(),
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
  })
  .superRefine(checkAnalysisDetail);
