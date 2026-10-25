"use client";
import { userQuerySchema } from "@/features/users/schemas/user.schema";
import type { UserQuery } from "@/features/users/types/users.types";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { queryIdSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { usersKeys } from "../api/users.keys";
import { usersService } from "../api/users.service";

export function useGetProfileQuery(userId: string) {
  const id = queryIdSchema.parse(userId);
  const { session } = useSession();
  const result = useQuery({
    queryKey: usersKeys.getProfile(session?.user.id ?? "anonymous", id),
    queryFn: ({ signal }) => usersService.getProfile(id, { signal }),
    enabled: Boolean(session) && Boolean(id),
    staleTime: 0,
  });
  return useQueryAccess(result, "users");
}

export function useListUsersQuery(
  query: UserQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = userQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? usersKeys.listUsers(session?.user.id ?? "anonymous", filters)
      : [
          "users",
          session?.user.id ?? "anonymous",
          "listUsers",
          "invalid-query",
        ],
    queryFn: ({ signal }) => usersService.listUsers(filters, { signal }),
    enabled:
      options.enabled !== false &&
      parsed.success &&
      hasPermission(session, "USERS_MANAGE"),
    staleTime: 30000,
  });
  return useQueryAccess(result, "users");
}
export function useGetUserQuery(userId: string, options: QueryOptions = {}) {
  const id = queryIdSchema.parse(userId);
  const { session } = useSession();
  const result = useQuery({
    queryKey: usersKeys.getUser(session?.user.id ?? "anonymous", id),
    queryFn: ({ signal }) => usersService.getUser(id, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(id) &&
      hasPermission(session, "USERS_MANAGE"),
    staleTime: 10000,
  });
  return useQueryAccess(result, "users");
}
