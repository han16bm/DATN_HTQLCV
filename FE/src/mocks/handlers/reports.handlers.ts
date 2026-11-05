import {
  createReportSchema,
  reportPreviewQuerySchema,
  reportPreviewSchema,
  reportQuerySchema,
  reportRowSchema,
  reportSchema,
  reportSubmitSchema,
  updateReportSchema,
} from "@/features/reports/schemas/reports.schema";
import { page } from "@/lib/validation/common.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { reportsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const reportHandlers = [
  http.get(
    "*/api/reports",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, reportQuerySchema);
      return mockJson(
        request,
        reportsDb.listReports(viewer, query),
        page(reportRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/report-previews",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, reportPreviewQuerySchema);
      return mockJson(
        request,
        reportsDb.getReportPreview(viewer, query),
        reportPreviewSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/reports/:reportId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const reportId = idSchema.parse(params.reportId);
      return mockJson(
        request,
        reportsDb.getReport(viewer, reportId),
        reportSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/reports",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createReportSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createReportDraft",
          feature: "reports",
          viewer,
          action: null,
          params: {},
          payload,
        },
        async () => {
          return mockJson(
            request,
            reportsDb.createReportDraft(viewer, payload),
            reportSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/reports/:reportId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const reportId = idSchema.parse(params.reportId);
      const payload = updateReportSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateReportDraft",
          feature: "reports",
          viewer,
          action: null,
          params: { reportId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            reportsDb.updateReportDraft(
              viewer,
              reportId,
              payload,
              request.headers.get("If-Match"),
            ),
            reportSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/reports/:reportId/refresh",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const reportId = idSchema.parse(params.reportId);
      const payload = emptySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "refreshReportDraft",
          feature: "reports",
          viewer,
          action: null,
          params: { reportId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            reportsDb.refreshReportDraft(
              viewer,
              reportId,
              request.headers.get("If-Match"),
            ),
            reportPreviewSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/reports/:reportId/submit",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const reportId = idSchema.parse(params.reportId);
      const payload = reportSubmitSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "submitReport",
          feature: "reports",
          viewer,
          action: null,
          params: { reportId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            reportsDb.submitReport(
              viewer,
              reportId,
              payload,
              request.headers.get("If-Match"),
            ),
            reportSchema,
            200,
          );
        },
      );
    }),
  ),
];
