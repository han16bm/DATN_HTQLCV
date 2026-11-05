import { reasonSchema, refSchema } from "@/lib/validation/common.schema";
import { z } from "zod";

// Mã quyền theo dự án (ProjectAccess.ProjectCodes), đúng thứ tự hiển thị.
export const projectPermissionCodes = [
  "PROJECT_MANAGE",
  "MEMBERS_MANAGE",
  "TASKS_MANAGE",
  "TASKS_REVIEW",
  "ANALYTICS_VIEW",
  "ALERTS_MANAGE",
] as const;
export const projectPermissionCodeSchema = z.enum(projectPermissionCodes);
export const projectRolePolicySchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "MEMBER"]),
  permissions: z.array(projectPermissionCodeSchema),
  editable: z.boolean(),
  version: z.number().int().safe().positive(),
  updatedAt: z.iso.datetime().nullable(),
  updatedBy: refSchema.nullable(),
});
export const updateProjectRolePolicySchema = z
  .object({
    permissions: z.array(projectPermissionCodeSchema),
    reason: reasonSchema.shape.reason,
  })
  .strict();
