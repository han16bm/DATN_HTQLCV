"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { ipWhitelistKeys } from "../api/ip-whitelist.keys";
import { ipWhitelistService } from "../api/ip-whitelist.service";

export function useGetIpWhitelistQuery() {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: ipWhitelistKeys.getIpWhitelist(viewerId),
    queryFn: ({ signal }) => ipWhitelistService.getIpWhitelist({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "ip-whitelist");
}
