import type { AuthApi } from "@/features/auth/api/auth.contract";
import {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import { type LoginInput } from "@/features/auth/types/auth.types";
import { apiClient } from "@/services/api-client";
import type { RequestOptions } from "@/services/api.types";
import { token } from "@/services/auth-session";
export const authService: AuthApi = {
  async login(payload: LoginInput, options: RequestOptions = {}) {
    const result = await apiClient.post(
      `/auth/login`,
      payload,
      loginResponseSchema,
      { ...options, skipAuthRefresh: true },
    );
    token.set(result.accessToken);
    return result.session;
  },
  logout(options: RequestOptions = {}) {
    return apiClient.post(`/auth/logout`, {}, logoutResultSchema, {
      ...options,
      skipAuthRefresh: true,
    });
  },
  async refreshSession(options: RequestOptions = {}) {
    const result = await apiClient.post(
      `/auth/refresh`,
      {},
      loginResponseSchema,
      { ...options, skipAuthRefresh: true },
    );
    token.set(result.accessToken);
    return result.session;
  },
  getSession(options: RequestOptions = {}) {
    return apiClient.get(`/auth/me`, sessionSchema, {
      ...options,
      skipAuthRefresh: true,
    });
  },
};
