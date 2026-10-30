import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
import type {
  createPermissionGroupSchema,
  permissionGroupMembersSchema,
  permissionGroupQuerySchema,
  permissionGroupSchema,
  updatePermissionGroupSchema,
} from "../schemas/permission-group.schema";

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
export type DeactivatePermissionGroupInput = z.input<typeof reasonSchema>;
export type DeactivatePermissionGroupArgs = {
  groupId: string;
  payload: DeactivatePermissionGroupInput;
  version: number;
};
