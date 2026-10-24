import type { UsersApi } from "@/features/users/api/users.contract";
import { resetUserPasswordResultSchema } from "@/features/users/schemas/user-form.schema";
import { userSchema } from "@/features/users/schemas/user.schema";
import {
  type CreateUserInput,
  type LockUserInput,
  type ResetUserPasswordInput,
  type UnlockUserInput,
  type UpdateUserInput,
  type UserQuery,
} from "@/features/users/types/users.types";
import { page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export const usersService: UsersApi = {
  listUsers(query: UserQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/users`, page(userSchema), {
      ...options,
      query,
    });
  },
  getUser(userId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/users/${encodeURIComponent(userId)}`,
      userSchema,
      options,
    );
  },
  createUser(payload: CreateUserInput, options: MutationOptions) {
    return apiClient.post(`/users`, payload, userSchema, options);
  },
  updateUser(
    userId: string,
    payload: UpdateUserInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/users/${encodeURIComponent(userId)}`,
      payload,
      userSchema,
      options,
    );
  },
  lockUser(userId: string, payload: LockUserInput, options: VersionOptions) {
    return apiClient.post(
      `/users/${encodeURIComponent(userId)}/lock`,
      payload,
      userSchema,
      options,
    );
  },
  unlockUser(
    userId: string,
    payload: UnlockUserInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/users/${encodeURIComponent(userId)}/unlock`,
      payload,
      userSchema,
      options,
    );
  },
  resetUserPassword(
    userId: string,
    payload: ResetUserPasswordInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/users/${encodeURIComponent(userId)}/reset-password`,
      payload,
      resetUserPasswordResultSchema,
      options,
    );
  },
};
