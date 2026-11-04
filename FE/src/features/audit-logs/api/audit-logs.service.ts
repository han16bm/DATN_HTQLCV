import { page } from "@/lib/validation/common.schema";
import { type RequestOptions, apiClient } from "@/services/api-client";
import { z } from "zod";
import { auditLogRowSchema, auditLogSchema } from "../schemas/audit-log.schema";
import type {
  AuditLogDto,
  AuditLogList,
  AuditLogQuery,
} from "../types/audit-logs.types";

export const auditLogsService = {
  async listAuditLogs(query: AuditLogQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<AuditLogList>("/audit-logs", {
      ...options,
      params: query,
      schema: page(auditLogRowSchema),
    });
    return response.data;
  },

  async getAuditLog(auditLogId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<AuditLogDto>(
      `/audit-logs/${encodeURIComponent(auditLogId)}`,
      { ...options, schema: auditLogSchema },
    );
    return response.data;
  },

  async listEntityTypes(options: RequestOptions = {}) {
    const response = await apiClient.get<string[]>("/audit-logs/entity-types", {
      ...options,
      schema: z.array(z.string()),
    });
    return response.data;
  },
};
