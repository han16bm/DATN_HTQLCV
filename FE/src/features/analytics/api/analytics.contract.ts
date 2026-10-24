// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  AnalyticsDashboardSchema,
  AnalyticsRisksSchema,
  AnalyticsWorkloadSchema,
  AnalyticsBottlenecksSchema,
  AnalyticsSummarySchema,
  AnalyticsAnalysisJobSchema,
  AnalyticsAnalysisDetailSchema,
  AnalyticsAnalysisFeedbackCreateSchema,
  AnalyticsAnalysisFeedbackSchema,
} from "../schemas/analytics.schema";
import { TasksTaskStatusSchema, TasksPrioritySchema } from "@/features/tasks";
import { SharedEntityLabelSchema } from "@/types/common";
import { page } from "@/types/common";
export const getDashboardContract = endpoint({
  ...{
    name: "getDashboard",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/dashboard",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
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
    .strict(),
  body: z.object({}).strict(),
  response: AnalyticsDashboardSchema,
});

export const getDeadlineRisksContract = endpoint({
  ...{
    name: "getDeadlineRisks",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/risks",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
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
    .strict(),
  body: z.object({}).strict(),
  response: AnalyticsRisksSchema,
});

export const getWorkloadContract = endpoint({
  ...{
    name: "getWorkload",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/workload",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
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
    .strict(),
  body: z.object({}).strict(),
  response: AnalyticsWorkloadSchema,
});

export const getBottlenecksContract = endpoint({
  ...{
    name: "getBottlenecks",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/bottlenecks",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
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
    .strict(),
  body: z.object({}).strict(),
  response: AnalyticsBottlenecksSchema,
});

export const getAnalysisSummaryContract = endpoint({
  ...{
    name: "getAnalysisSummary",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/summary",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
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
    .strict(),
  body: z.object({}).strict(),
  response: AnalyticsSummarySchema,
});

export const createAnalysisJobContract = endpoint({
  ...{
    name: "createAnalysisJob",
    feature: "analytics",
    method: "POST",
    path: "/api/v1/analytics/jobs",
    version: false,
    idempotency: true,
    invalidates: ["analysis-detail", "analytics-jobs"],
    permission: "ANALYTICS_VIEW",
    fields: [
      {
        name: "analysisId",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo.",
      },
      {
        name: "generationMode",
        type: "enum(REUSE_OR_CREATE, REGENERATE)",
        required: false,
        rules:
          "mặc định REUSE_OR_CREATE; REUSE_OR_CREATE tận dụng kết quả/job hiện có; REGENERATE chỉ sau click Phân tích lại.",
      },
      {
        name: "locale",
        type: "enum(vi-VN)",
        required: false,
        rules: "mặc định vi-VN",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
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
    .strict(),
  response: AnalyticsAnalysisJobSchema,
});

export const getAnalysisJobContract = endpoint({
  ...{
    name: "getAnalysisJob",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/jobs/:jobId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z
    .object({
      jobId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AnalyticsAnalysisJobSchema,
});

export const getAnalysisDetailContract = endpoint({
  ...{
    name: "getAnalysisDetail",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/details/:analysisId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z
    .object({
      analysisId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AnalyticsAnalysisDetailSchema,
});

export const createAnalysisFeedbackContract = endpoint({
  ...{
    name: "createAnalysisFeedback",
    feature: "analytics",
    method: "POST",
    path: "/api/v1/analytics/details/:analysisId/feedback",
    version: false,
    idempotency: true,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      analysisId: z.string().trim().min(1).max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: AnalyticsAnalysisFeedbackCreateSchema,
  response: AnalyticsAnalysisFeedbackSchema,
});

export const listAnalyticsFilterOptionsContract = endpoint({
  ...{
    name: "listAnalyticsFilterOptions",
    feature: "analytics",
    method: "GET",
    path: "/api/v1/analytics/filter-options",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
    .object({
      kind: z.enum(["UNIT", "PROJECT", "TEAM", "PERSON"]),
      q: z.string().trim().max(255).optional(),
      unitId: z.string().min(1).optional(),
      projectId: z.string().min(1).optional(),
      teamId: z.string().min(1).optional(),
      page: z.number().int().min(1).optional().default(1),
      pageSize: z.number().int().min(1).max(100).optional().default(20),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(SharedEntityLabelSchema),
});
