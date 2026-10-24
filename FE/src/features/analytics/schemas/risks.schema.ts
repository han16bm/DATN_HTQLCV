import {
  analysisMetaSchema,
  qualitySchema,
} from "@/features/analytics/schemas/analysis-meta.schema";
import { taskStatusSchema } from "@/features/tasks/schemas/task.schema";
import {
  analysisRefSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { z } from "zod";
export const riskItemSchema = z.object({
  taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  taskTitle: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  status: taskStatusSchema,
  assignee: personRefSchema.nullable(),
  dueAt: z.iso.datetime(),
  category: z.enum(["AT_RISK", "OVERDUE", "INSUFFICIENT_DATA", "NO_SIGNAL"]),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  assessmentBasis: z.enum(["BUSINESS_RULES"]),
  ruleIds: z.array(z.string()),
  evidence: z.array(z.string()),
  quality: qualitySchema,
  analysisRef: analysisRefSchema,
});
export const projectRiskSummarySchema = z.object({
  projectId: z.string(),
  projectName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  overdueCount: z.number().int().safe().min(0),
  atRiskCount: z.number().int().safe().min(0),
  insufficientDataCount: z.number().int().safe().min(0),
  ruleIds: z.array(z.string()),
  evidence: z.array(z.string()),
  quality: qualitySchema,
  analysisRef: analysisRefSchema,
});
export const risksSchema = z.object({
  metadata: analysisMetaSchema,
  items: z.array(riskItemSchema),
  projects: z.array(projectRiskSummarySchema),
});
