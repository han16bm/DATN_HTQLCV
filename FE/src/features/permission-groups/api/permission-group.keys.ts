import type { ViewerId } from "@/types/common";
import { type PermissionGroupQuery } from "../types/permission-group.types";
export const permissionGroupKeys = {
  all: ["permissionGroups"] as const,
  viewer: (viewerId: ViewerId) =>
    ["permissionGroups", viewerId ?? "anonymous"] as const,
  list: (viewerId: ViewerId, query: PermissionGroupQuery) =>
    [...permissionGroupKeys.viewer(viewerId), "list", query] as const,
  get: (viewerId: ViewerId, groupId: string) =>
    [...permissionGroupKeys.viewer(viewerId), "get", groupId] as const,
};
