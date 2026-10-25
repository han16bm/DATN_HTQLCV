import type { UsersApi } from "@/features/users/api/users.contract";
import { resetUserPasswordResultSchema } from "@/features/users/schemas/user-form.schema";
import {
  userRowSchema,
  userSchema,
} from "@/features/users/schemas/user.schema";
import {
  type CreateUserInput,
  type LockUserInput,
  type ResetUserPasswordInput,
  type UnlockUserInput,
  type UpdateUserInput,
  type UserQuery,
} from "@/features/users/types/users.types";
import { page } from "@/lib/validation/common.schema";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
import { profileSchema } from "../schemas/profile.schema";
export const usersService: UsersApi = {
  listUsers(query: UserQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/users", { ...options, params: query })
      .then(parseResponse(page(userRowSchema)));
  },
  getUser(userId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/users/${encodeURIComponent(userId)}`, options)
      .then(parseResponse(userSchema));
  },
  getProfile(userId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/users/${encodeURIComponent(userId)}/profile`, options)
      .then(parseResponse(profileSchema));
  },
  createUser(payload: CreateUserInput, options: MutationOptions) {
    return apiClient
      .post<unknown>("/users", payload, options)
      .then(parseResponse(userSchema));
  },
  updateUser(
    userId: string,
    payload: UpdateUserInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(`/users/${encodeURIComponent(userId)}`, payload, options)
      .then(parseResponse(userSchema));
  },
  lockUser(userId: string, payload: LockUserInput, options: VersionOptions) {
    return apiClient
      .post<unknown>(
        `/users/${encodeURIComponent(userId)}/lock`,
        payload,
        options,
      )
      .then(parseResponse(userSchema));
  },
  unlockUser(
    userId: string,
    payload: UnlockUserInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/users/${encodeURIComponent(userId)}/unlock`,
        payload,
        options,
      )
      .then(parseResponse(userSchema));
  },
  resetUserPassword(
    userId: string,
    payload: ResetUserPasswordInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/users/${encodeURIComponent(userId)}/reset-password`,
        payload,
        options,
      )
      .then(parseResponse(resetUserPasswordResultSchema));
  },
};
