"use client";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { authKeys } from "../api/auth.keys";
import { authService } from "../api/auth.service";

export function useGetSessionQuery(options: QueryOptions = {}) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: authKeys.getSession(session?.user.id ?? "anonymous"),
    queryFn: ({ signal }) => authService.getSession({ signal }),
    enabled: options.enabled !== false,
    staleTime: 10000,
  });
  return useQueryAccess(result, "auth");
}
