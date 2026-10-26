import {
  createProjectSchema,
  getProjectClosureChecksResultSchema,
  projectHistoryQuerySchema,
  projectQuerySchema,
  projectRowSchema,
  projectSchema,
  updateProjectSchema,
} from "@/features/projects/schemas/projects.schema";
import {
  auditSchema,
  page,
  reasonSchema,
} from "@/lib/validation/common.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { projectsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const projectHandlers = [
  http.get(
    "*/api/projects",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, projectQuerySchema);
      return mockJson(
        request,
        projectsDb.listProjects(viewer, query),
        page(projectRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/projects/:projectId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      return mockJson(
        request,
        projectsDb.getProject(viewer, projectId),
        projectSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/projects",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createProjectSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createProject",
          feature: "projects",
          viewer,
          action: "PROJECT_CREATE",
          params: {},
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectsDb.createProject(viewer, payload),
            projectSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/projects/:projectId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const payload = updateProjectSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateProject",
          feature: "projects",
          viewer,
          action: "PROJECT_MANAGE",
          params: { projectId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectsDb.updateProject(
              viewer,
              projectId,
              payload,
              request.headers.get("If-Match"),
            ),
            projectSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/projects/:projectId/activate",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const payload = emptySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "activateProject",
          feature: "projects",
          viewer,
          action: "PROJECT_MANAGE",
          params: { projectId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectsDb.activateProject(
              viewer,
              projectId,
              request.headers.get("If-Match"),
            ),
            projectSchema,
            200,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/projects/:projectId/closure-checks",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      return mockJson(
        request,
        projectsDb.getProjectClosureChecks(viewer, projectId),
        getProjectClosureChecksResultSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/projects/:projectId/complete",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const payload = emptySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "completeProject",
          feature: "projects",
          viewer,
          action: "PROJECT_MANAGE",
          params: { projectId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectsDb.completeProject(
              viewer,
              projectId,
              request.headers.get("If-Match"),
            ),
            projectSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/projects/:projectId/cancel",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "cancelProject",
          feature: "projects",
          viewer,
          action: "PROJECT_MANAGE",
          params: { projectId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectsDb.cancelProject(
              viewer,
              projectId,
              payload,
              request.headers.get("If-Match"),
            ),
            projectSchema,
            200,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/projects/:projectId/history",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const query = parseQuery(request, projectHistoryQuerySchema);
      return mockJson(
        request,
        projectsDb.listProjectHistory(viewer, projectId, query),
        page(auditSchema),
        200,
      );
    }),
  ),
];
