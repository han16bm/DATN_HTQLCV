import { z } from "zod";
export const qualitySchema = z.object({
  status: z.enum(["SUFFICIENT", "PARTIAL", "INSUFFICIENT"]),
});
export const analysisMetaSchema = z.object({
  dataAsOf: z.iso.datetime(),
  quality: qualitySchema,
});
