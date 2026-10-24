import type {
  analysisRefSchema,
  analysisSubjectSchema,
  auditSchema,
  domainActionSchema,
  entityLabelSchema,
  personRefSchema,
  reasonSchema,
} from "@/lib/validation/common.schema";
import { type z } from "zod";
export type ReasonInput = z.output<typeof reasonSchema>;
export type EntityLabelDto = z.output<typeof entityLabelSchema>;
export type PersonRefDto = z.output<typeof personRefSchema>;
export type AuditDto = z.output<typeof auditSchema>;
export type AnalysisSubjectDto = z.output<typeof analysisSubjectSchema>;
export type AnalysisRefDto = z.output<typeof analysisRefSchema>;
export type DomainActionDto = z.output<typeof domainActionSchema>;
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}
export interface Page<T> {
  items: T[];
  pagination: Pagination;
}
