import { z } from "zod";
export const idSchema = z
  .string()
  .trim()
  .min(1, "Thiếu mã tài nguyên.")
  .max(100);
// An empty ID keeps a dependent query disabled until its resource is selected.
export const queryIdSchema = idSchema.catch("");
export const emptySchema = z.object({}).strict();
