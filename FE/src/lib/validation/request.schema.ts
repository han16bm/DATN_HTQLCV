import { z } from "zod";
export const idSchema = z
  .string()
  .trim()
  .min(1, "Thiếu mã tài nguyên.")
  .max(100);
export const emptySchema = z.object({}).strict();
