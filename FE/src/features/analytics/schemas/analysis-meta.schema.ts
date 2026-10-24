import { z } from "zod";
export const qualitySchema = z.object({
  status: z.enum(["SUFFICIENT", "PARTIAL", "INSUFFICIENT"]),
});
export const analysisMetaSchema = z.object({
  dataAsOf: z.iso.datetime(),
  calculationVersion: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(100),
  quality: qualitySchema,
});
