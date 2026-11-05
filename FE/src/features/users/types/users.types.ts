import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
import type { profileSchema } from "../schemas/profile.schema";
import type {
  createUserSchema,
  resetPasswordSchema,
  resetUserPasswordResultSchema,
  updateUserSchema,
  userLockSchema,
} from "../schemas/user-form.schema";
import type {
  updateUserPermissionsSchema,
  userPermissionsSchema,
} from "../schemas/user-permissions.schema";
import type { userProjectSchema } from "../schemas/user-projects.schema";
import type {
  userQuerySchema,
  userRowSchema,
  userSchema,
} from "../schemas/user.schema";
export type ProfileDto = z.output<typeof profileSchema>;
export type UserDto = z.output<typeof userSchema>;
export type UserQuery = z.input<typeof userQuerySchema>;
export type UserRow = z.output<typeof userRowSchema>;
export type UserList = Page<UserRow>;
export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type UpdateUserArgs = {
  userId: string;
  payload: UpdateUserInput;
  version: number;
};
export type LockUserInput = z.input<typeof userLockSchema>;
export type LockUserArgs = {
  userId: string;
  payload: LockUserInput;
  version: number;
};
export type UnlockUserInput = z.input<typeof reasonSchema>;
export type UnlockUserArgs = {
  userId: string;
  payload: UnlockUserInput;
  version: number;
};
export type ResetUserPasswordInput = z.input<typeof resetPasswordSchema>;
export type ResetUserPasswordResult = z.output<
  typeof resetUserPasswordResultSchema
>;
export type ResetUserPasswordArgs = {
  userId: string;
  payload: ResetUserPasswordInput;
  version: number;
};
export type UserPermissionsDto = z.output<typeof userPermissionsSchema>;
export type UpdateUserPermissionsInput = z.input<
  typeof updateUserPermissionsSchema
>;
export type UpdateUserPermissionsArgs = {
  userId: string;
  payload: UpdateUserPermissionsInput;
  version: number;
};
export type UserProjectDto = z.output<typeof userProjectSchema>;
export type RevokeUserSessionsInput = z.input<typeof reasonSchema>;
export type RevokeUserSessionsArgs = {
  userId: string;
  payload: RevokeUserSessionsInput;
};
