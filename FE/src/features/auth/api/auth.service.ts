import type { AuthApi } from "@/features/auth/api/auth.contract";
import {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import type {
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/features/auth/types/auth.types";
import { passwordResultSchema } from "../schemas/password.schema";
import type {
  RequestOptions,
  VersionOptions,
  MutationOptions,
} from "@/services/api-client";
import {
  apiClient,
  parseResponse,
  skipAuthRefreshConfig,
  token,
} from "@/services/api-client";
export const authService: AuthApi = {
  async login(payload: LoginInput, options: RequestOptions = {}) {
    const result = await apiClient
      .post<unknown>("/auth/login", payload, {
        ...options,
        ...skipAuthRefreshConfig,
      })
      .then(parseResponse(loginResponseSchema));
    token.set(result.accessToken);
    return result.session;
  },
  logout(options: RequestOptions = {}) {
    return apiClient
      .post<unknown>(
        "/auth/logout",
        {},
        { ...options, ...skipAuthRefreshConfig },
      )
      .then(parseResponse(logoutResultSchema));
  },
  async refreshSession(options: RequestOptions = {}) {
    const result = await apiClient
      .post<unknown>(
        "/auth/refresh",
        {},
        { ...options, ...skipAuthRefreshConfig },
      )
      .then(parseResponse(loginResponseSchema));
    token.set(result.accessToken);
    return result.session;
  },
  getSession(options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/auth/me", { ...options, ...skipAuthRefreshConfig })
      .then(parseResponse(sessionSchema));
  },
  updateProfile(payload: UpdateProfileInput, options: VersionOptions) {
    const form = new FormData();
    if (payload.username !== undefined) form.set("username", payload.username);
    if (payload.displayName !== undefined)
      form.set("displayName", payload.displayName);
    if (payload.avatar) form.set("avatar", payload.avatar);
    return apiClient
      .patch<unknown>("/auth/me", form, options)
      .then(parseResponse(sessionSchema));
  },
  changePassword(payload: ChangePasswordInput, options: MutationOptions) {
    return apiClient
      .put<unknown>("/auth/me/password", payload, options)
      .then(parseResponse(passwordResultSchema));
  },
};
