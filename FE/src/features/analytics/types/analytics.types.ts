import type { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import type { evidenceSchema } from "@/features/analytics/schemas/analysis-explanation.schema";
import type {
  feedbackInputSchema,
  feedbackSchema,
} from "@/features/analytics/schemas/analysis-feedback.schema";
import type {
  createJobSchema,
  jobErrorSchema,
  jobSchema,
} from "@/features/analytics/schemas/analysis-job.schema";
import type {
  analysisMetaSchema,
  qualitySchema,
} from "@/features/analytics/schemas/analysis-meta.schema";
import type {
  contextItemSchema,
  measureSchema,
} from "@/features/analytics/schemas/analysis-snapshot.schema";
import type {
  analyticsQuerySchema,
  filterOptionsQuerySchema,
} from "@/features/analytics/schemas/analytics-query.schema";
import type { bottlenecksSchema } from "@/features/analytics/schemas/bottlenecks.schema";
import type {
  dashboardSchema,
  metricSchema,
} from "@/features/analytics/schemas/dashboard.schema";
import type { risksSchema } from "@/features/analytics/schemas/risks.schema";
import type { summarySchema } from "@/features/analytics/schemas/summary.schema";
import type { workloadSchema } from "@/features/analytics/schemas/workload.schema";
import { type EntityLabelDto, type Page } from "@/types/common";
import { type z } from "zod";
export type AnalysisErrorDto = z.output<typeof jobErrorSchema>;
export type JobDto = z.output<typeof jobSchema>;
export type QualityDto = z.output<typeof qualitySchema>;
export type AnalysisMetaDto = z.output<typeof analysisMetaSchema>;
export type BottlenecksDto = z.output<typeof bottlenecksSchema>;
export type MetricDto = z.output<typeof metricSchema>;
export type DashboardDto = z.output<typeof dashboardSchema>;
export type RisksDto = z.output<typeof risksSchema>;
export type MeasureDto = z.output<typeof measureSchema>;
export type SummaryDto = z.output<typeof summarySchema>;
export type WorkloadDto = z.output<typeof workloadSchema>;
export type EvidenceDto = z.output<typeof evidenceSchema>;
export type ContextItemDto = z.output<typeof contextItemSchema>;
export type FeedbackDto = z.output<typeof feedbackSchema>;
export type AnalysisDto = z.output<typeof analysisSchema>;
export type AnalyticsQuery = z.input<typeof analyticsQuerySchema>;
export type CreateJobInput = z.input<typeof createJobSchema>;
export type FeedbackInput = z.input<typeof feedbackInputSchema>;
export type FeedbackArgs = {
  analysisId: string;
  payload: FeedbackInput;
};
export type FilterOptionsQuery = z.input<typeof filterOptionsQuerySchema>;
export type FilterList = Page<EntityLabelDto>;
