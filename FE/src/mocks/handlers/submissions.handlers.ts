import {
  approveSchema,
  createSubmissionSchema,
  reviewQueueQuerySchema,
  reviewRowSchema,
  revisionSchema,
  submissionQuerySchema,
  submissionResultSchema,
  submissionRowSchema,
  submissionSchema,
} from "@/features/submissions/schemas/submissions.schema";
import { page } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { submissionsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const submissionHandlers = [
  http.get(
    "*/api/tasks/:taskId/submissions",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const query = parseQuery(request, submissionQuerySchema);
      return mockJson(
        request,
        submissionsDb.listSubmissions(viewer, taskId, query),
        page(submissionRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/tasks/:taskId/submissions/:submissionId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const submissionId = idSchema.parse(params.submissionId);
      return mockJson(
        request,
        submissionsDb.getSubmission(viewer, taskId, submissionId),
        submissionSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/tasks/:taskId/submissions",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = createSubmissionSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createSubmission",
          feature: "submissions",
          viewer,
          action: null,
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            submissionsDb.createSubmission(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            submissionResultSchema,
            201,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/tasks/:taskId/submissions/:submissionId/approve",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const submissionId = idSchema.parse(params.submissionId);
      const payload = approveSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "approveSubmission",
          feature: "submissions",
          viewer,
          action: "TASKS_REVIEW",
          params: { taskId, submissionId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            submissionsDb.approveSubmission(
              viewer,
              taskId,
              submissionId,
              payload,
              request.headers.get("If-Match"),
            ),
            submissionResultSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/tasks/:taskId/submissions/:submissionId/request-revision",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const submissionId = idSchema.parse(params.submissionId);
      const payload = revisionSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "requestSubmissionRevision",
          feature: "submissions",
          viewer,
          action: "TASKS_REVIEW",
          params: { taskId, submissionId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            submissionsDb.requestSubmissionRevision(
              viewer,
              taskId,
              submissionId,
              payload,
              request.headers.get("If-Match"),
            ),
            submissionResultSchema,
            200,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/review-queue",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, reviewQueueQuerySchema);
      return mockJson(
        request,
        submissionsDb.listReviewQueue(viewer, query),
        page(reviewRowSchema),
        200,
      );
    }),
  ),
];
