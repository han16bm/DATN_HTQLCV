import {
  type CreateUserInput,
  type LockUserInput,
  type ResetUserPasswordInput,
  type ResetUserPasswordResult,
  type UnlockUserInput,
  type UpdateUserInput,
  type UserDto,
  type UserList,
  type UserQuery,
} from "@/features/users/types/users.types";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
export interface UsersApi {
  listUsers(query?: UserQuery, options?: RequestOptions): Promise<UserList>;
  getUser(userId: string, options?: RequestOptions): Promise<UserDto>;
  createUser(
    payload: CreateUserInput,
    options: MutationOptions,
  ): Promise<UserDto>;
  updateUser(
    userId: string,
    payload: UpdateUserInput,
    options: VersionOptions,
  ): Promise<UserDto>;
  lockUser(
    userId: string,
    payload: LockUserInput,
    options: VersionOptions,
  ): Promise<UserDto>;
  unlockUser(
    userId: string,
    payload: UnlockUserInput,
    options: VersionOptions,
  ): Promise<UserDto>;
  resetUserPassword(
    userId: string,
    payload: ResetUserPasswordInput,
    options: VersionOptions,
  ): Promise<ResetUserPasswordResult>;
}
