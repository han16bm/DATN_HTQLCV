import type {
  analysisRefSchema,
  analysisSubjectSchema,
  auditSchema,
  domainActionSchema,
  entityLabelSchema,
  paginationSchema,
  permissionSchema,
} from "@/lib/validation/common.schema";
import { type z } from "zod";
export type Permission = z.output<typeof permissionSchema>;
export type ViewerId = string | null | undefined;
export type EntityLabelDto = z.output<typeof entityLabelSchema>;
export type AuditDto = z.output<typeof auditSchema>;
export type AnalysisSubjectDto = z.output<typeof analysisSubjectSchema>;
export type AnalysisRefDto = z.output<typeof analysisRefSchema>;
export type DomainActionDto = z.output<typeof domainActionSchema>;
type Pagination = z.output<typeof paginationSchema>;
export interface Page<T> {
  items: T[];
  pagination: Pagination;
}
