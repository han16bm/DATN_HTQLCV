import { checkJob } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const createJobSchema = z
  .object({
    analysisId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    generationMode: z
      .enum(["REUSE_OR_CREATE", "REGENERATE"])
      .optional()
      .default("REUSE_OR_CREATE"),
    locale: z.enum(["vi-VN"]).optional().default("vi-VN"),
  })
  .strict();
export const jobErrorSchema = z.object({
  code: z.enum([
    "LLM_NOT_CONFIGURED",
    "PROVIDER_TIMEOUT",
    "PROVIDER_RATE_LIMIT",
    "PROVIDER_UNAVAILABLE",
    "OUTPUT_INVALID",
    "REFUSED",
    "INSUFFICIENT_DATA",
  ]),
  message: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(1000),
  retryable: z.boolean(),
  retryAfterSeconds: z.number().int().safe().nullable(),
});
export const jobSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"]),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    pollAfterMs: z.number().int().safe().min(0).max(10000),
    result: z
      .object({
        analysisId: z
          .string()
          .min(1, "Vui lòng nhập thông tin bắt buộc")
          .max(100),
        explanationId: z
          .string()
          .min(1, "Vui lòng nhập thông tin bắt buộc")
          .max(100),
      })
      .nullable(),
    error: jobErrorSchema.nullable(),
  })
  .superRefine(checkJob);
