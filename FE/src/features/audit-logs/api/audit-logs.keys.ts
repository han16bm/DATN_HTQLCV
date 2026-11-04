import type { ViewerId } from "@/types/common";
import type { AuditLogQuery } from "../types/audit-logs.types";
export const auditLogsKeys = {
  viewer: (viewerId: ViewerId) =>
    ["audit-logs", viewerId ?? "anonymous"] as const,
  listAuditLogs: (viewerId: ViewerId, query: AuditLogQuery) =>
    [...auditLogsKeys.viewer(viewerId), "listAuditLogs", query] as const,
  getAuditLog: (viewerId: ViewerId, auditLogId: string) =>
    [...auditLogsKeys.viewer(viewerId), "getAuditLog", auditLogId] as const,
  listEntityTypes: (viewerId: ViewerId) =>
    [...auditLogsKeys.viewer(viewerId), "listEntityTypes"] as const,
};
