import { z } from "zod";
export const explanationRatingStateSchema = z.object({
  mine: z.boolean().nullable(),
  canSubmit: z.boolean(),
});
export const explanationRatingSchema = z.object({
  helpful: z.boolean(),
  ratedAt: z.iso.datetime(),
});
export const explanationRatingInputSchema = z
  .object({ helpful: z.boolean() })
  .strict();
