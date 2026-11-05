"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { ipWhitelistKeys } from "../api/ip-whitelist.keys";
import { ipWhitelistService } from "../api/ip-whitelist.service";
import { ipAccessLogQuerySchema } from "../schemas/ip-whitelist.schema";
import type { IpAccessLogQuery } from "../types/ip-whitelist.types";

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

export function useListIpAccessLogsQuery(query: IpAccessLogQuery = {}) {
  const viewerId = useSession().session?.user.id;
  const filters = ipAccessLogQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: ipWhitelistKeys.listIpAccessLogs(viewerId, filters),
    queryFn: ({ signal }) =>
      ipWhitelistService.listIpAccessLogs(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "ip-whitelist");
}
