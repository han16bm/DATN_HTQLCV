// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import {
  checkProjection,
  checkAnalysisDetail,
  checkJob,
} from "@/lib/validation/contract-refinements";
import { TasksTaskStatusSchema, TasksPrioritySchema } from "@/features/tasks";
import {
  SharedPersonRefSchema,
  SharedAnalysisRefSchema,
  SharedDomainActionSchema,
  SharedAnalysisSubjectSchema,
} from "@/types/common";
export const AnalyticsAnalysisJobCreateSchema = z
  .object({
    analysisId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    generationMode: z
      .enum(["REUSE_OR_CREATE", "REGENERATE"])
      .optional()
      .default("REUSE_OR_CREATE"),
    locale: z.enum(["vi-VN"]).optional().default("vi-VN"),
  })
  .strict();
export type AnalyticsAnalysisJobCreateDTO = z.output<
  typeof AnalyticsAnalysisJobCreateSchema
>;

export const AnalyticsAnalysisErrorSchema = z.object({
  code: z.enum([
    "LLM_NOT_CONFIGURED",
    "PROVIDER_TIMEOUT",
    "PROVIDER_RATE_LIMIT",
    "PROVIDER_UNAVAILABLE",
    "OUTPUT_INVALID",
    "REFUSED",
    "INSUFFICIENT_DATA",
  ]),
  message: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(1000),
  retryable: z.boolean(),
  retryAfterSeconds: z.number().int().safe().nullable(),
});
export type AnalyticsAnalysisErrorDTO = z.output<
  typeof AnalyticsAnalysisErrorSchema
>;

export const AnalyticsAnalysisJobSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"]),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    pollAfterMs: z.number().int().safe().min(0).max(10000),
    result: z
      .object({
        analysisId: z
          .string()
          .min(1, "Vui lòng nhập thông tin bắt buộc")
          .max(100),
        explanationId: z
          .string()
          .min(1, "Vui lòng nhập thông tin bắt buộc")
          .max(100),
      })
      .nullable(),
    error: AnalyticsAnalysisErrorSchema.nullable(),
  })
  .superRefine(checkJob);
export type AnalyticsAnalysisJobDTO = z.output<
  typeof AnalyticsAnalysisJobSchema
>;

export const AnalyticsAnalyticsQuerySchema = z
  .object({
    unitId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    projectId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    ownerId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    assigneeId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    status: TasksTaskStatusSchema.optional(),
    priority: TasksPrioritySchema.optional(),
    from: z.iso.date(),
    to: z.iso.date(),
    teamId: z.string().trim().optional(),
  })
  .strict();
export type AnalyticsAnalyticsQueryDTO = z.output<
  typeof AnalyticsAnalyticsQuerySchema
>;

export const AnalyticsQualitySchema = z.object({
  status: z.enum(["SUFFICIENT", "PARTIAL", "INSUFFICIENT"]),
  missingFields: z.array(z.string()),
  scopeLimited: z.boolean(),
});
export type AnalyticsQualityDTO = z.output<typeof AnalyticsQualitySchema>;

export const AnalyticsAnalysisMetaSchema = z.object({
  snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  dataAsOf: z.iso.datetime(),
  generatedAt: z.iso.datetime(),
  scope: AnalyticsAnalyticsQuerySchema,
  calculationMethod: z.enum(["SERVER_RULES"]),
  calculationVersion: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(100),
  quality: AnalyticsQualitySchema,
});
export type AnalyticsAnalysisMetaDTO = z.output<
  typeof AnalyticsAnalysisMetaSchema
>;

export const AnalyticsBottlenecksSchema = z.object({
  metadata: AnalyticsAnalysisMetaSchema,
  items: z.array(
    z.object({
      taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
      stage: z.enum(["TODO", "IN_PROGRESS", "PENDING_REVIEW"]),
      elapsedMinutes: z.number().finite().min(0),
      revisionCount: z.number().int().safe().min(0),
      calendarBasis: z.enum(["CONTINUOUS", "WORKING_CALENDAR"]),
      evidence: z.array(z.string()),
      taskTitle: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
      assignee: SharedPersonRefSchema.nullable(),
      analysisRef: SharedAnalysisRefSchema,
    }),
  ),
});
export type AnalyticsBottlenecksDTO = z.output<
  typeof AnalyticsBottlenecksSchema
>;

export const AnalyticsMetricSchema = z.object({
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
  analysisRef: SharedAnalysisRefSchema,
});
export type AnalyticsMetricDTO = z.output<typeof AnalyticsMetricSchema>;

export const AnalyticsDashboardSchema = z.object({
  metadata: AnalyticsAnalysisMetaSchema,
  totalTasks: z.number().int().safe().min(0),
  completedTasks: z.number().int().safe().min(0),
  cancelledTasks: z.number().int().safe().min(0),
  openTasks: z.number().int().safe().min(0),
  overdueTasks: z.number().int().safe().min(0),
  completionRate: z.number().finite().nullable(),
  actualMinutes: z.number().int().safe().min(0),
  byStatus: z.array(
    z.object({
      status: TasksTaskStatusSchema,
      count: z.number().int().safe().min(0),
    }),
  ),
  metrics: z.array(AnalyticsMetricSchema),
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
      quality: AnalyticsQualitySchema,
      analysisRef: SharedAnalysisRefSchema,
      projectName: z
        .string()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      actualMinutes: z.number().int().safe().min(0),
    }),
  ),
  overviewRef: SharedAnalysisRefSchema,
});
export type AnalyticsDashboardDTO = z.output<typeof AnalyticsDashboardSchema>;

export const AnalyticsRiskItemSchema = z.object({
  taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  taskTitle: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  status: TasksTaskStatusSchema,
  assignee: SharedPersonRefSchema.nullable(),
  dueAt: z.iso.datetime(),
  category: z.enum(["AT_RISK", "OVERDUE", "INSUFFICIENT_DATA", "NO_SIGNAL"]),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  assessmentBasis: z.enum(["BUSINESS_RULES"]),
  ruleIds: z.array(z.string()),
  evidence: z.array(z.string()),
  quality: AnalyticsQualitySchema,
  analysisRef: SharedAnalysisRefSchema,
});
export type AnalyticsRiskItemDTO = z.output<typeof AnalyticsRiskItemSchema>;

export const AnalyticsProjectRiskSummarySchema = z.object({
  projectId: z.string(),
  projectName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  overdueCount: z.number().int().safe().min(0),
  atRiskCount: z.number().int().safe().min(0),
  insufficientDataCount: z.number().int().safe().min(0),
  ruleIds: z.array(z.string()),
  evidence: z.array(z.string()),
  quality: AnalyticsQualitySchema,
  analysisRef: SharedAnalysisRefSchema,
});
export type AnalyticsProjectRiskSummaryDTO = z.output<
  typeof AnalyticsProjectRiskSummarySchema
>;

export const AnalyticsRisksSchema = z.object({
  metadata: AnalyticsAnalysisMetaSchema,
  items: z.array(AnalyticsRiskItemSchema),
  projects: z.array(AnalyticsProjectRiskSummarySchema),
});
export type AnalyticsRisksDTO = z.output<typeof AnalyticsRisksSchema>;

export const AnalyticsAnalysisMeasureSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  code: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  value: z.number().finite().nullable(),
  unit: z.enum(["TASK", "COUNT", "PERCENT", "MINUTE", "HOUR"]),
  basis: z.enum(["CURRENT", "PERIOD"]),
  formula: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  evidenceIds: z.array(z.string()),
  missingFields: z.array(z.string()),
});
export type AnalyticsAnalysisMeasureDTO = z.output<
  typeof AnalyticsAnalysisMeasureSchema
>;

export const AnalyticsHighlightSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  description: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  severity: z.enum(["INFO", "MEDIUM", "HIGH"]),
  analysisRef: SharedAnalysisRefSchema,
});
export type AnalyticsHighlightDTO = z.output<typeof AnalyticsHighlightSchema>;

export const AnalyticsSummarySchema = z.object({
  metadata: AnalyticsAnalysisMetaSchema,
  overviewRef: SharedAnalysisRefSchema,
  metrics: z.array(AnalyticsAnalysisMeasureSchema),
  highlights: z.array(AnalyticsHighlightSchema),
  summaryText: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(4000),
});
export type AnalyticsSummaryDTO = z.output<typeof AnalyticsSummarySchema>;

export const AnalyticsWorkloadSchema = z.object({
  metadata: AnalyticsAnalysisMetaSchema,
  items: z.array(
    z.object({
      userId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
      openTaskCount: z.number().int().safe().min(0),
      pendingReviewCount: z.number().int().safe().min(0),
      originalEstimateMinutes: z.number().int().safe().min(0),
      currentEstimateMinutes: z.number().int().safe().min(0),
      remainingMinutes: z.number().int().safe().nullable(),
      capacityMinutes: z.number().int().safe().nullable(),
      utilizationRate: z.number().finite().nullable(),
      quality: AnalyticsQualitySchema,
      person: SharedPersonRefSchema,
      analysisRef: SharedAnalysisRefSchema,
    }),
  ),
});
export type AnalyticsWorkloadDTO = z.output<typeof AnalyticsWorkloadSchema>;

export const AnalyticsEvidenceSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  sourceType: z.enum([
    "TASK",
    "TIME_LOG",
    "SUBMISSION",
    "REPORT",
    "HISTORY",
    "AGGREGATE",
  ]),
  sourceId: z.string().nullable(),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(1000),
  observedAt: z.iso.datetime().nullable(),
  action: SharedDomainActionSchema.nullable(),
});
export type AnalyticsEvidenceDTO = z.output<typeof AnalyticsEvidenceSchema>;

export const AnalyticsFindingSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  text: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(3000),
  metricIds: z.array(z.string()),
  evidenceIds: z.array(z.string()),
});
export type AnalyticsFindingDTO = z.output<typeof AnalyticsFindingSchema>;

export const AnalyticsRecommendationSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  text: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]),
  evidenceIds: z.array(z.string()),
  action: SharedDomainActionSchema.nullable(),
});
export type AnalyticsRecommendationDTO = z.output<
  typeof AnalyticsRecommendationSchema
>;

export const AnalyticsLlmExplanationSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  locale: z.enum(["vi-VN"]),
  generatedAt: z.iso.datetime(),
  modelDisplayName: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(255),
  promptVersion: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  summary: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(4000),
  findings: z.array(AnalyticsFindingSchema),
  recommendations: z.array(AnalyticsRecommendationSchema),
  limitations: z.array(z.string()),
});
export type AnalyticsLlmExplanationDTO = z.output<
  typeof AnalyticsLlmExplanationSchema
>;

export const AnalyticsExplanationStateSchema = z.object({
  status: z.enum([
    "NOT_REQUESTED",
    "QUEUED",
    "RUNNING",
    "READY",
    "FAILED",
    "UNAVAILABLE",
  ]),
  lastSuccess: AnalyticsLlmExplanationSchema.nullable(),
  activeJobId: z.string().nullable(),
  error: AnalyticsAnalysisErrorSchema.nullable(),
});
export type AnalyticsExplanationStateDTO = z.output<
  typeof AnalyticsExplanationStateSchema
>;

export const AnalyticsContextItemSchema = z.object({
  key: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  value: z.string().nullable(),
  valueType: z.enum(["TEXT", "UTC", "DATE"]),
});
export type AnalyticsContextItemDTO = z.output<
  typeof AnalyticsContextItemSchema
>;

export const AnalyticsAnalysisSeriesSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  label: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  unit: z.enum(["TASK", "COUNT", "PERCENT", "MINUTE", "HOUR"]),
  points: z.array(
    z.object({
      date: z.iso.date(),
      value: z.number().finite().nullable(),
    }),
  ),
});
export type AnalyticsAnalysisSeriesDTO = z.output<
  typeof AnalyticsAnalysisSeriesSchema
>;

export const AnalyticsAnalysisSnapshotSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  sourceRevision: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(255),
  analysisType: z.enum(["RISK", "WORKLOAD", "BOTTLENECK", "SUMMARY", "METRIC"]),
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  subject: SharedAnalysisSubjectSchema,
  scope: AnalyticsAnalyticsQuerySchema,
  dataAsOf: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  calculationVersion: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(100),
  quality: AnalyticsQualitySchema,
  metrics: z.array(AnalyticsAnalysisMeasureSchema),
  context: z.array(AnalyticsContextItemSchema),
  series: z.array(AnalyticsAnalysisSeriesSchema),
  evidence: z.array(AnalyticsEvidenceSchema),
});
export type AnalyticsAnalysisSnapshotDTO = z.output<
  typeof AnalyticsAnalysisSnapshotSchema
>;

export const AnalyticsFreshnessSchema = z.object({
  status: z.enum(["CURRENT", "OUTDATED"]),
  checkedAt: z.iso.datetime(),
  latestAnalysisId: z.string().nullable(),
});
export type AnalyticsFreshnessDTO = z.output<typeof AnalyticsFreshnessSchema>;

export const AnalyticsGenerationPolicySchema = z.object({
  allowed: z.boolean(),
  blockedReason: z
    .enum([
      "SNAPSHOT_OUTDATED",
      "INSUFFICIENT_DATA",
      "LLM_NOT_CONFIGURED",
      "ACTIVE_JOB",
      "RATE_LIMITED",
    ])
    .nullable(),
  retryAfterSeconds: z.number().int().safe().nullable(),
});
export type AnalyticsGenerationPolicyDTO = z.output<
  typeof AnalyticsGenerationPolicySchema
>;

export const AnalyticsAnalysisFeedbackSchema = z
  .object({
    id: z.string(),
    analysisId: z.string(),
    snapshotId: z.string(),
    verdict: z.enum(["CONFIRMED", "REJECTED"]),
    comment: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
    actorId: z.string(),
    actor: SharedPersonRefSchema,
    createdAt: z.iso.datetime(),
  })
  .superRefine(checkProjection);
export type AnalyticsAnalysisFeedbackDTO = z.output<
  typeof AnalyticsAnalysisFeedbackSchema
>;

export const AnalyticsAnalysisDetailSchema = z
  .object({
    snapshot: AnalyticsAnalysisSnapshotSchema,
    freshness: AnalyticsFreshnessSchema,
    explanation: AnalyticsExplanationStateSchema,
    generation: AnalyticsGenerationPolicySchema,
    systemSummary: z
      .string()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(4000),
    feedback: z.object({
      latest: AnalyticsAnalysisFeedbackSchema.nullable(),
      canSubmit: z.boolean(),
    }),
  })
  .superRefine(checkAnalysisDetail);
export type AnalyticsAnalysisDetailDTO = z.output<
  typeof AnalyticsAnalysisDetailSchema
>;

export const AnalyticsAnalysisFeedbackCreateSchema = z
  .object({
    verdict: z.enum(["CONFIRMED", "REJECTED"]),
    comment: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export type AnalyticsAnalysisFeedbackCreateDTO = z.output<
  typeof AnalyticsAnalysisFeedbackCreateSchema
>;
