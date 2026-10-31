import {
  analysisRefSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { analysisMetaSchema, qualitySchema } from "./analysis-meta.schema";
export const riskItemSchema = z.object({
  taskId: idSchema,
  taskTitle: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  assignee: personRefSchema.nullable(),
  category: z.enum(["AT_RISK", "OVERDUE", "INSUFFICIENT_DATA", "NO_SIGNAL"]),
  evidence: z.array(z.string()),
  quality: qualitySchema,
  analysisRef: analysisRefSchema,
});
const projectRiskSummarySchema = z.object({
  projectName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  overdueCount: z.number().int().safe().min(0),
  atRiskCount: z.number().int().safe().min(0),
  insufficientDataCount: z.number().int().safe().min(0),
  evidence: z.array(z.string()),
  analysisRef: analysisRefSchema,
});
export const risksSchema = z.object({
  metadata: analysisMetaSchema,
  items: z.array(riskItemSchema),
  projects: z.array(projectRiskSummarySchema),
});
