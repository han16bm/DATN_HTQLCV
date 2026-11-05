import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
import type {
  featureSchema,
  updateFeatureSchema,
} from "../schemas/feature.schema";
import type {
  createPermissionGroupSchema,
  permissionGroupMembersSchema,
  permissionGroupQuerySchema,
  permissionGroupSchema,
  updatePermissionGroupSchema,
} from "../schemas/permission-group.schema";
import type {
  projectRolePolicySchema,
  updateProjectRolePolicySchema,
} from "../schemas/project-role-policy.schema";
export type FeatureDto = z.output<typeof featureSchema>;
export type UpdateFeatureInput = z.input<typeof updateFeatureSchema>;
export type UpdateFeatureArgs = {
  code: string;
  payload: UpdateFeatureInput;
  version: number;
};
export type PermissionGroupDto = z.output<typeof permissionGroupSchema>;
export type PermissionGroupQuery = z.input<typeof permissionGroupQuerySchema>;
export type PermissionGroupList = Page<PermissionGroupDto>;
export type CreatePermissionGroupInput = z.input<
  typeof createPermissionGroupSchema
>;
export type UpdatePermissionGroupInput = z.input<
  typeof updatePermissionGroupSchema
>;
export type UpdatePermissionGroupArgs = {
  groupId: string;
  payload: UpdatePermissionGroupInput;
  version: number;
};
export type ReplacePermissionGroupMembersInput = z.input<
  typeof permissionGroupMembersSchema
>;
export type ReplacePermissionGroupMembersArgs = {
  groupId: string;
  payload: ReplacePermissionGroupMembersInput;
  version: number;
};
export type SetPermissionGroupStatusArgs = {
  groupId: string;
  payload: z.input<typeof reasonSchema>;
  version: number;
  active: boolean;
};

export type ProjectRolePolicyDto = z.output<typeof projectRolePolicySchema>;
export type UpdateProjectRolePolicyInput = z.input<
  typeof updateProjectRolePolicySchema
>;
export type UpdateProjectRolePolicyArgs = {
  role: ProjectRolePolicyDto["role"];
  payload: UpdateProjectRolePolicyInput;
  version: number;
};
