import type { reasonSchema } from "@/lib/validation/common.schema";
import { type AuditDto, type Page } from "@/types/common";
import { type z } from "zod";
import type {
  createProjectSchema,
  getProjectClosureChecksResultSchema,
  projectHistoryQuerySchema,
  projectQuerySchema,
  projectRowSchema,
  projectSchema,
  transferProjectOwnerSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";
export type ProjectDto = z.output<typeof projectSchema>;
export type ProjectQuery = z.input<typeof projectQuerySchema>;
export type ProjectRow = z.output<typeof projectRowSchema>;
export type ProjectList = Page<ProjectRow>;
export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type UpdateProjectArgs = {
  projectId: string;
  payload: UpdateProjectInput;
  version: number;
};
export type ActivateProjectArgs = { projectId: string; version: number };
export type GetProjectClosureChecksResult = z.output<
  typeof getProjectClosureChecksResultSchema
>;
export type CompleteProjectArgs = { projectId: string; version: number };
export type CancelProjectInput = z.input<typeof reasonSchema>;
export type CancelProjectArgs = {
  projectId: string;
  payload: CancelProjectInput;
  version: number;
};
export type TransferProjectOwnerInput = z.input<
  typeof transferProjectOwnerSchema
>;
export type TransferProjectOwnerArgs = {
  projectId: string;
  payload: TransferProjectOwnerInput;
  version: number;
};
export type ProjectHistoryQuery = z.input<typeof projectHistoryQuerySchema>;
export type ProjectHistoryList = Page<AuditDto>;
