import { type Page } from "@/types/common";
import { type z } from "zod";
import type {
  auditLogQuerySchema,
  auditLogRowSchema,
  auditLogSchema,
} from "../schemas/audit-log.schema";
export type AuditLogQuery = z.input<typeof auditLogQuerySchema>;
export type AuditLogRow = z.output<typeof auditLogRowSchema>;
export type AuditLogDto = z.output<typeof auditLogSchema>;
export type AuditLogList = Page<AuditLogRow>;
