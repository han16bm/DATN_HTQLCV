import {
  type LoginInput,
  type LogoutResult,
  type SessionDto,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ChangePasswordResult,
} from "@/features/auth/types/auth.types";
import type {
  RequestOptions,
  VersionOptions,
  MutationOptions,
} from "@/services/api-client";
export interface AuthApi {
  login(payload: LoginInput, options?: RequestOptions): Promise<SessionDto>;
  logout(options?: RequestOptions): Promise<LogoutResult>;
  refreshSession(options?: RequestOptions): Promise<SessionDto>;
  getSession(options?: RequestOptions): Promise<SessionDto>;
  updateProfile(
    payload: UpdateProfileInput,
    options: VersionOptions,
  ): Promise<SessionDto>;
  changePassword(
    payload: ChangePasswordInput,
    options: MutationOptions,
  ): Promise<ChangePasswordResult>;
}
