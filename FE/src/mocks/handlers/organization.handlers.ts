import {
  createTeamSchema,
  teamMembersSchema,
  teamQuerySchema,
  teamRowSchema,
  teamSchema,
  updateTeamSchema,
} from "@/features/organization/schemas/team.schema";
import {
  createUnitSchema,
  unitQuerySchema,
  unitRowSchema,
  unitSchema,
  updateUnitSchema,
} from "@/features/organization/schemas/unit.schema";
import { page, reasonSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { organizationDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const organizationHandlers = [
  http.get(
    "*/api/v1/units",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, unitQuerySchema);
      return mockJson(
        request,
        organizationDb.listUnits(viewer, query),
        page(unitRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/units/:unitId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const unitId = idSchema.parse(params.unitId);
      return mockJson(
        request,
        organizationDb.getUnit(viewer, unitId),
        unitSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/units",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createUnitSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createUnit",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: {},
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.createUnit(viewer, payload),
            unitSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/v1/units/:unitId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const unitId = idSchema.parse(params.unitId);
      const payload = updateUnitSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateUnit",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: { unitId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.updateUnit(
              viewer,
              unitId,
              payload,
              request.headers.get("If-Match"),
            ),
            unitSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/units/:unitId/deactivate",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const unitId = idSchema.parse(params.unitId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "deactivateUnit",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: { unitId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.deactivateUnit(
              viewer,
              unitId,
              payload,
              request.headers.get("If-Match"),
            ),
            unitSchema,
            200,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/v1/teams",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, teamQuerySchema);
      return mockJson(
        request,
        organizationDb.listTeams(viewer, query),
        page(teamRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/teams/:teamId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const teamId = idSchema.parse(params.teamId);
      return mockJson(
        request,
        organizationDb.getTeam(viewer, teamId),
        teamSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/teams",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createTeamSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createTeam",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: {},
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.createTeam(viewer, payload),
            teamSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/v1/teams/:teamId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const teamId = idSchema.parse(params.teamId);
      const payload = updateTeamSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateTeam",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: { teamId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.updateTeam(
              viewer,
              teamId,
              payload,
              request.headers.get("If-Match"),
            ),
            teamSchema,
            200,
          );
        },
      );
    }),
  ),
  http.put(
    "*/api/v1/teams/:teamId/members",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const teamId = idSchema.parse(params.teamId);
      const payload = teamMembersSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "replaceTeamMembers",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: { teamId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.replaceTeamMembers(
              viewer,
              teamId,
              payload,
              request.headers.get("If-Match"),
            ),
            teamSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/teams/:teamId/deactivate",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const teamId = idSchema.parse(params.teamId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "deactivateTeam",
          feature: "organization",
          viewer,
          permission: "ORGANIZATION_MANAGE",
          params: { teamId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            organizationDb.deactivateTeam(
              viewer,
              teamId,
              payload,
              request.headers.get("If-Match"),
            ),
            teamSchema,
            200,
          );
        },
      );
    }),
  ),
];
