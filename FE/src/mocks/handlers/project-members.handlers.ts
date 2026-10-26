import {
  addMemberSchema,
  memberRoleSchema,
  membershipSchema,
  projectMemberQuerySchema,
} from "@/features/project-members/schemas/project-members.schema";
import { page, reasonSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { projectMembersDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const projectMemberHandlers = [
  http.get(
    "*/api/projects/:projectId/members",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const query = parseQuery(request, projectMemberQuerySchema);
      return mockJson(
        request,
        projectMembersDb.listProjectMembers(viewer, projectId, query),
        page(membershipSchema),
        200,
      );
    }),
  ),
  http.post(
    "*/api/projects/:projectId/members",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const payload = addMemberSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "addProjectMember",
          feature: "project-members",
          viewer,
          action: "MEMBERS_MANAGE",
          params: { projectId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectMembersDb.addProjectMember(viewer, projectId, payload),
            membershipSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/projects/:projectId/members/:membershipId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const membershipId = idSchema.parse(params.membershipId);
      const payload = memberRoleSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateProjectMemberRole",
          feature: "project-members",
          viewer,
          action: "MEMBERS_MANAGE",
          params: { projectId, membershipId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectMembersDb.updateProjectMemberRole(
              viewer,
              projectId,
              membershipId,
              payload,
              request.headers.get("If-Match"),
            ),
            membershipSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/projects/:projectId/members/:membershipId/end",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const membershipId = idSchema.parse(params.membershipId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "endProjectMembership",
          feature: "project-members",
          viewer,
          action: "MEMBERS_MANAGE",
          params: { projectId, membershipId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            projectMembersDb.endProjectMembership(
              viewer,
              projectId,
              membershipId,
              payload,
              request.headers.get("If-Match"),
            ),
            membershipSchema,
            200,
          );
        },
      );
    }),
  ),
];
