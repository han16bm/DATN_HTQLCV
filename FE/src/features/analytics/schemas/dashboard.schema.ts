import {
  analysisMetaSchema,
  qualitySchema,
} from "@/features/analytics/schemas/analysis-meta.schema";
import { taskStatusSchema } from "@/features/tasks/schemas/task.schema";
import { analysisRefSchema } from "@/lib/validation/common.schema";
import { z } from "zod";
export const metricSchema = z.object({
  code: z.enum([
    "K01",
    "K02",
    "K03",
    "K04",
    "K05",
    "K06",
    "K07",
    "K08",
    "K09",
    "K10",
    "K11",
    "K12",
    "K13",
    "K14",
    "K15",
    "K16",
  ]),
  label: z.string(),
  value: z.number().finite().nullable(),
  unit: z.enum(["TASK", "COUNT", "PERCENT", "MINUTE", "HOUR", "REPORT"]),
  basis: z.enum(["CURRENT", "PERIOD"]),
  aggregation: z.enum(["COUNT", "SUM", "MEAN", "RATIO"]),
  denominator: z.number().finite().nullable(),
  missingFields: z.array(z.string()),
  analysisRef: analysisRefSchema,
});
export const dashboardSchema = z.object({
  metadata: analysisMetaSchema,
  totalTasks: z.number().int().safe().min(0),
  completedTasks: z.number().int().safe().min(0),
  cancelledTasks: z.number().int().safe().min(0),
  openTasks: z.number().int().safe().min(0),
  overdueTasks: z.number().int().safe().min(0),
  completionRate: z.number().finite().nullable(),
  actualMinutes: z.number().int().safe().min(0),
  byStatus: z.array(
    z.object({
      status: taskStatusSchema,
      count: z.number().int().safe().min(0),
    }),
  ),
  metrics: z.array(metricSchema).max(16),
  timeVariance: z.object({
    actualMinutes: z.number().finite().min(0),
    currentEstimateMinutes: z.number().finite().min(0),
    originalEstimateMinutes: z.number().finite().min(0),
    deltaCurrentMinutes: z.number().finite(),
    deltaOriginalMinutes: z.number().finite(),
  }),
  submissionTimeliness: z.object({
    onTimeCount: z.number().int().safe().min(0),
    lateCount: z.number().int().safe().min(0),
    denominator: z.number().int().safe().min(0),
  }),
  acceptedSubmissionTimeliness: z.object({
    onTimeCount: z.number().int().safe().min(0),
    lateCount: z.number().int().safe().min(0),
    denominator: z.number().int().safe().min(0),
  }),
  reporting: z.object({
    submittedDaily: z.number().int().safe().min(0),
    submittedWeekly: z.number().int().safe().min(0),
    expectedCount: z.number().int().safe().nullable(),
    submissionCoverageRate: z.number().finite().nullable(),
  }),
  trend: z.array(
    z.object({
      date: z.iso.date(),
      completedCount: z.number().int().safe().nullable(),
      submissionCount: z.number().int().safe().nullable(),
      actualMinutes: z.number().int().safe().nullable(),
      complete: z.boolean(),
    }),
  ),
  projectComparisons: z.array(
    z.object({
      projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
      validTaskCount: z.number().int().safe().min(0),
      completionRate: z.number().finite().nullable(),
      overdueCount: z.number().int().safe().min(0),
      activeAlertCount: z.number().int().safe().min(0),
      quality: qualitySchema,
      analysisRef: analysisRefSchema,
      projectName: z
        .string()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      actualMinutes: z.number().int().safe().min(0),
    }),
  ),
  overviewRef: analysisRefSchema,
});
