"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { authKeys } from "../api/auth.keys";
import { authService } from "../api/auth.service";

export function useProfileQuery() {
  const viewerId = useSession().session?.user.id;
  const query = useQuery({
    queryKey: authKeys.getProfile(viewerId),
    queryFn: ({ signal }) => authService.getProfile({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 0,
  });
  return useQueryAccess(query, "auth");
}
