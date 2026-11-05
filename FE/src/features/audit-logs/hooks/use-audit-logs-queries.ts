"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { auditLogsKeys } from "../api/audit-logs.keys";
import { auditLogsService } from "../api/audit-logs.service";
import { auditLogQuerySchema } from "../schemas/audit-log.schema";
import type { AuditLogQuery } from "../types/audit-logs.types";

export function useListAuditLogsQuery(query: AuditLogQuery = {}) {
  const viewerId = useSession().session?.user.id;
  const filters = auditLogQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: auditLogsKeys.listAuditLogs(viewerId, filters),
    queryFn: ({ signal }) =>
      auditLogsService.listAuditLogs(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "audit-logs");
}

export function useGetAuditLogQuery(auditLogId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: auditLogsKeys.getAuditLog(viewerId, auditLogId),
    queryFn: ({ signal }) =>
      auditLogsService.getAuditLog(auditLogId, { signal }),
    enabled: Boolean(viewerId && auditLogId),
    staleTime: 60000,
  });
  return useQueryAccess(result, "audit-logs");
}

export function useListEntityTypesQuery() {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: auditLogsKeys.listEntityTypes(viewerId),
    queryFn: ({ signal }) => auditLogsService.listEntityTypes({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 60000,
  });
  return useQueryAccess(result, "audit-logs");
}
