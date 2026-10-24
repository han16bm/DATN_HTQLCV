import { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import {
  feedbackInputSchema,
  feedbackSchema,
} from "@/features/analytics/schemas/analysis-feedback.schema";
import {
  createJobSchema,
  jobSchema,
} from "@/features/analytics/schemas/analysis-job.schema";
import {
  analyticsQuerySchema,
  filterOptionsQuerySchema,
} from "@/features/analytics/schemas/analytics-query.schema";
import { bottlenecksSchema } from "@/features/analytics/schemas/bottlenecks.schema";
import { dashboardSchema } from "@/features/analytics/schemas/dashboard.schema";
import { risksSchema } from "@/features/analytics/schemas/risks.schema";
import { summarySchema } from "@/features/analytics/schemas/summary.schema";
import { workloadSchema } from "@/features/analytics/schemas/workload.schema";
import { entityLabelSchema, page } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { analyticsDb } from "@/mocks/db";
import { http } from "msw";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const analyticsHandlers = [
  http.get(
    "*/api/v1/dashboard",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, analyticsQuerySchema);
      return mockJson(
        request,
        analyticsDb.getDashboard(viewer, query),
        dashboardSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/risks",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, analyticsQuerySchema);
      return mockJson(
        request,
        analyticsDb.getDeadlineRisks(viewer, query),
        risksSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/workload",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, analyticsQuerySchema);
      return mockJson(
        request,
        analyticsDb.getWorkload(viewer, query),
        workloadSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/bottlenecks",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, analyticsQuerySchema);
      return mockJson(
        request,
        analyticsDb.getBottlenecks(viewer, query),
        bottlenecksSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/summary",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, analyticsQuerySchema);
      return mockJson(
        request,
        analyticsDb.getAnalysisSummary(viewer, query),
        summarySchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/analytics/jobs",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createJobSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createAnalysisJob",
          feature: "analytics",
          viewer,
          permission: "ANALYTICS_VIEW",
          params: {},
          payload,
        },
        async () => {
          const job = analyticsDb.createAnalysisJob(
            viewer,
            payload,
            request.headers.get("X-Mock-Scenario"),
          );
          return mockJson(
            request,
            job,
            jobSchema,
            job.status === "SUCCEEDED" ? 200 : 202,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/jobs/:jobId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const jobId = idSchema.parse(params.jobId);
      return mockJson(
        request,
        analyticsDb.getAnalysisJob(viewer, jobId),
        jobSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/details/:analysisId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const analysisId = idSchema.parse(params.analysisId);
      return mockJson(
        request,
        analyticsDb.getAnalysisDetail(viewer, analysisId),
        analysisSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/analytics/details/:analysisId/feedback",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const analysisId = idSchema.parse(params.analysisId);
      const payload = feedbackInputSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createAnalysisFeedback",
          feature: "analytics",
          viewer,
          permission: null,
          params: { analysisId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            analyticsDb.createAnalysisFeedback(viewer, analysisId, payload),
            feedbackSchema,
            201,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/v1/analytics/filter-options",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, filterOptionsQuerySchema);
      return mockJson(
        request,
        analyticsDb.listAnalyticsFilterOptions(viewer, query),
        page(entityLabelSchema),
        200,
      );
    }),
  ),
];
