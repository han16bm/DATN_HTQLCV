import { z } from "zod";
export const qualitySchema = z.object({
  status: z.enum(["SUFFICIENT", "PARTIAL", "INSUFFICIENT"]),
  missingFields: z.array(z.string().max(255)).default([]),
});
export const analysisMetaSchema = z.object({
  dataAsOf: z.iso.datetime(),
  quality: qualitySchema,
});
