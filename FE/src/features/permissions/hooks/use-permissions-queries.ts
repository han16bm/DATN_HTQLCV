"use client";

import { useSession } from "@/lib/auth/session-context";
import {
  type QueryOptions,
  useQueryAccess,
} from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { permissionsKeys } from "../api/permissions.keys";
import { permissionsService } from "../api/permissions.service";
import { permissionGroupQuerySchema } from "../schemas/permission-group.schema";
import type { PermissionGroupQuery } from "../types/permissions.types";

export function useListFeaturesQuery() {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: permissionsKeys.listFeatures(viewerId),
    queryFn: ({ signal }) => permissionsService.listFeatures({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "permissions");
}

export function useListPermissionGroupsQuery(
  query: PermissionGroupQuery = {},
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const filters = permissionGroupQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: permissionsKeys.listPermissionGroups(viewerId, filters),
    queryFn: ({ signal }) =>
      permissionsService.listPermissionGroups(filters, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "permissions");
}

export function useGetPermissionGroupQuery(groupId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: permissionsKeys.getPermissionGroup(viewerId, groupId),
    queryFn: ({ signal }) =>
      permissionsService.getPermissionGroup(groupId, { signal }),
    enabled: Boolean(viewerId && groupId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "permissions");
}
