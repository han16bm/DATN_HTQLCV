import {
  featureCodeSchema,
  featureSchema,
  updateFeatureSchema,
} from "@/features/permissions/schemas/feature.schema";
import {
  createPermissionGroupSchema,
  permissionGroupMembersSchema,
  permissionGroupQuerySchema,
  permissionGroupSchema,
  updatePermissionGroupSchema,
} from "@/features/permissions/schemas/permission-group.schema";
import { page, reasonSchema } from "@/lib/validation/common.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { z } from "zod";
import { permissionsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";

const command = {
  feature: "permissions",
  action: "PERMISSIONS_MANAGE" as const,
};
export const permissionHandlers = [
  http.get(
    "*/api/features",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      parseQuery(request, emptySchema);
      return mockJson(
        request,
        permissionsDb.listFeatures(viewer),
        z.array(featureSchema),
      );
    }),
  ),
  http.patch(
    "*/api/features/:code",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const code = featureCodeSchema.parse(params.code);
      const payload = updateFeatureSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "updateFeature",
          viewer,
          params: { code },
          payload,
        },
        () =>
          mockJson(
            request,
            permissionsDb.updateFeature(
              viewer,
              code,
              payload,
              request.headers.get("If-Match"),
            ),
            featureSchema,
          ),
      );
    }),
  ),
  http.get(
    "*/api/permission-groups",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, permissionGroupQuerySchema);
      return mockJson(
        request,
        permissionsDb.listPermissionGroups(viewer, query),
        page(permissionGroupSchema),
      );
    }),
  ),
  http.get(
    "*/api/permission-groups/:groupId",
    mockHandler(({ request, params }) => {
      const viewer = authenticatedUser(request);
      const groupId = idSchema.parse(params.groupId);
      return mockJson(
        request,
        permissionsDb.getPermissionGroup(viewer, groupId),
        permissionGroupSchema,
      );
    }),
  ),
  http.post(
    "*/api/permission-groups",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createPermissionGroupSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "createPermissionGroup",
          viewer,
          params: {},
          payload,
        },
        () =>
          mockJson(
            request,
            permissionsDb.createPermissionGroup(viewer, payload),
            permissionGroupSchema,
            201,
          ),
      );
    }),
  ),
  http.patch(
    "*/api/permission-groups/:groupId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const groupId = idSchema.parse(params.groupId);
      const payload = updatePermissionGroupSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "updatePermissionGroup",
          viewer,
          params: { groupId },
          payload,
        },
        () =>
          mockJson(
            request,
            permissionsDb.updatePermissionGroup(
              viewer,
              groupId,
              payload,
              request.headers.get("If-Match"),
            ),
            permissionGroupSchema,
          ),
      );
    }),
  ),
  http.put(
    "*/api/permission-groups/:groupId/members",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const groupId = idSchema.parse(params.groupId);
      const payload = permissionGroupMembersSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "replacePermissionGroupMembers",
          viewer,
          params: { groupId },
          payload,
        },
        () =>
          mockJson(
            request,
            permissionsDb.replacePermissionGroupMembers(
              viewer,
              groupId,
              payload,
              request.headers.get("If-Match"),
            ),
            permissionGroupSchema,
          ),
      );
    }),
  ),
  ...(["deactivate", "activate"] as const).map((verb) =>
    http.post(
      `*/api/permission-groups/:groupId/${verb}`,
      mockHandler(async ({ request, params }) => {
        const viewer = authenticatedUser(request);
        const groupId = idSchema.parse(params.groupId);
        const payload = reasonSchema.parse(await request.json());
        return mockCommand(
          request,
          {
            ...command,
            operation: `${verb}PermissionGroup`,
            viewer,
            params: { groupId },
            payload,
          },
          () =>
            mockJson(
              request,
              permissionsDb.setPermissionGroupStatus(
                viewer,
                groupId,
                verb === "activate",
                payload.reason,
                request.headers.get("If-Match"),
              ),
              permissionGroupSchema,
            ),
        );
      }),
    ),
  ),
];
