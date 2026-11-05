import {
  backgroundJobSchema,
  jobRunQuerySchema,
  jobRunSchema,
  updateJobSchema,
} from "@/features/jobs/schemas/job.schema";
import { page } from "@/lib/validation/common.schema";
import { emptySchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { z } from "zod";
import { jobsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";

const code = z.string().trim().min(1).max(100);
export const jobHandlers = [
  http.get(
    "*/api/jobs",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      parseQuery(request, emptySchema);
      return mockJson(
        request,
        jobsDb.listJobs(viewer),
        z.array(backgroundJobSchema),
      );
    }),
  ),
  http.patch(
    "*/api/jobs/:code",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const jobCode = code.parse(params.code);
      const payload = updateJobSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateJob",
          feature: "jobs",
          viewer,
          action: "JOBS_MANAGE",
          params: { code: jobCode },
          payload,
        },
        () =>
          mockJson(
            request,
            jobsDb.updateJob(
              viewer,
              jobCode,
              payload,
              request.headers.get("If-Match"),
            ),
            backgroundJobSchema,
          ),
      );
    }),
  ),
  http.post(
    "*/api/jobs/:code/run",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const jobCode = code.parse(params.code);
      const payload = emptySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "runJob",
          feature: "jobs",
          viewer,
          action: "JOBS_MANAGE",
          params: { code: jobCode },
          payload,
        },
        () => mockJson(request, jobsDb.runJob(viewer, jobCode), jobRunSchema),
      );
    }),
  ),
  http.get(
    "*/api/jobs/:code/runs",
    mockHandler(({ request, params }) => {
      const viewer = authenticatedUser(request);
      const jobCode = code.parse(params.code);
      const query = parseQuery(request, jobRunQuerySchema);
      return mockJson(
        request,
        jobsDb.listJobRuns(viewer, jobCode, query),
        page(jobRunSchema),
      );
    }),
  ),
];
