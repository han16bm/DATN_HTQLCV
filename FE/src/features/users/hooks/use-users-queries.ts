"use client";

import { useSession } from "@/lib/auth/session-context";
import {
  type QueryOptions,
  useQueryAccess,
} from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { usersKeys } from "../api/users.keys";
import { usersService } from "../api/users.service";
import { userQuerySchema } from "../schemas/user.schema";
import type { UserQuery } from "../types/users.types";

export function useGetProfileQuery(userId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: usersKeys.getProfile(viewerId, userId),
    queryFn: ({ signal }) => usersService.getProfile(userId, { signal }),
    enabled: Boolean(viewerId && userId),
    staleTime: 0,
  });
  return useQueryAccess(result, "users");
}

export function useListUsersQuery(
  query: UserQuery = {},
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = userQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: usersKeys.listUsers(viewerId, filters),
    queryFn: ({ signal }) => usersService.listUsers(filters, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "users");
}

export function useGetUserQuery(userId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: usersKeys.getUser(viewerId, userId),
    queryFn: ({ signal }) => usersService.getUser(userId, { signal }),
    enabled: Boolean(viewerId && userId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "users");
}

export function useGetUserPermissionsQuery(userId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: usersKeys.getUserPermissions(viewerId, userId),
    queryFn: ({ signal }) =>
      usersService.getUserPermissions(userId, { signal }),
    enabled: Boolean(viewerId && userId),
    staleTime: 0,
  });
  return useQueryAccess(result, "users");
}

export function useListUserProjectsQuery(
  userId: string,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: usersKeys.listUserProjects(viewerId, userId),
    queryFn: ({ signal }) => usersService.listUserProjects(userId, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId && userId),
    staleTime: 0,
  });
  return useQueryAccess(result, "users");
}
