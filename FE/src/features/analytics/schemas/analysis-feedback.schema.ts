import { personRefSchema } from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const feedbackSchema = z
  .object({
    verdict: z.enum(["CONFIRMED", "REJECTED"]),
    comment: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
    actor: personRefSchema,
    createdAt: z.iso.datetime(),
  })
  .superRefine(checkProjection);
export const feedbackInputSchema = z
  .object({
    verdict: z.enum(["CONFIRMED", "REJECTED"]),
    comment: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
