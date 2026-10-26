import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { profileSchema } from "../schemas/profile.schema";
import { resetUserPasswordResultSchema } from "../schemas/user-form.schema";
import { userRowSchema, userSchema } from "../schemas/user.schema";
import type {
  CreateUserInput,
  LockUserInput,
  ProfileDto,
  ResetUserPasswordInput,
  ResetUserPasswordResult,
  UnlockUserInput,
  UpdateUserInput,
  UserDto,
  UserList,
  UserQuery,
} from "../types/users.types";

export const usersService = {
  async listUsers(query: UserQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<UserList>("/users", {
      ...options,
      params: query,
      schema: page(userRowSchema),
    });
    return response.data;
  },

  async getUser(userId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<UserDto>(
      `/users/${encodeURIComponent(userId)}`,
      { ...options, schema: userSchema },
    );
    return response.data;
  },

  async getProfile(userId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<ProfileDto>(
      `/users/${encodeURIComponent(userId)}/profile`,
      { ...options, schema: profileSchema },
    );
    return response.data;
  },

  async createUser(payload: CreateUserInput, options: MutationOptions) {
    const response = await apiClient.post<UserDto>("/users", payload, {
      ...options,
      schema: userSchema,
    });
    return response.data;
  },

  async updateUser(
    userId: string,
    payload: UpdateUserInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<UserDto>(
      `/users/${encodeURIComponent(userId)}`,
      payload,
      { ...options, schema: userSchema },
    );
    return response.data;
  },

  async lockUser(
    userId: string,
    payload: LockUserInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<UserDto>(
      `/users/${encodeURIComponent(userId)}/lock`,
      payload,
      { ...options, schema: userSchema },
    );
    return response.data;
  },

  async unlockUser(
    userId: string,
    payload: UnlockUserInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<UserDto>(
      `/users/${encodeURIComponent(userId)}/unlock`,
      payload,
      { ...options, schema: userSchema },
    );
    return response.data;
  },

  async resetUserPassword(
    userId: string,
    payload: ResetUserPasswordInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<ResetUserPasswordResult>(
      `/users/${encodeURIComponent(userId)}/reset-password`,
      payload,
      { ...options, schema: resetUserPasswordResultSchema },
    );
    return response.data;
  },
};
