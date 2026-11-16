import {
  auditLogQuerySchema,
  auditLogRowSchema,
  auditLogSchema,
} from "@/features/audit-logs/schemas/audit-log.schema";
import { page } from "@/lib/validation/common.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { z } from "zod";
import { auditLogsDb } from "../db";
import { authenticatedUser, mockHandler, mockJson, parseQuery } from "./http";

export const auditLogHandlers = [
  http.get(
    "*/api/audit-logs",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, auditLogQuerySchema);
      return mockJson(
        request,
        auditLogsDb.listAuditLogs(viewer, query),
        page(auditLogRowSchema),
      );
    }),
  ),
  http.get(
    "*/api/audit-logs/entity-types",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      parseQuery(request, emptySchema);
      return mockJson(
        request,
        auditLogsDb.listEntityTypes(viewer),
        z.array(z.string()),
      );
    }),
  ),
  http.get(
    "*/api/audit-logs/:auditLogId",
    mockHandler(({ request, params }) => {
      const viewer = authenticatedUser(request);
      const auditLogId = idSchema.parse(params.auditLogId);
      return mockJson(
        request,
        auditLogsDb.getAuditLog(viewer, auditLogId),
        auditLogSchema,
      );
    }),
  ),
];
