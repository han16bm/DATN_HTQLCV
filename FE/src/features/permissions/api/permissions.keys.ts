import type { ViewerId } from "@/types/common";
import type { PermissionGroupQuery } from "../types/permissions.types";
export const permissionsKeys = {
  viewer: (viewerId: ViewerId) =>
    ["permissions", viewerId ?? "anonymous"] as const,
  listFeatures: (viewerId: ViewerId) =>
    [...permissionsKeys.viewer(viewerId), "listFeatures"] as const,
  listPermissionGroups: (viewerId: ViewerId, query: PermissionGroupQuery) =>
    [
      ...permissionsKeys.viewer(viewerId),
      "listPermissionGroups",
      query,
    ] as const,
  getPermissionGroup: (viewerId: ViewerId, groupId: string) =>
    [
      ...permissionsKeys.viewer(viewerId),
      "getPermissionGroup",
      groupId,
    ] as const,
};
