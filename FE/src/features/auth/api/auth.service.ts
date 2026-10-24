import type { AuthApi } from "@/features/auth/api/auth.contract";
import {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import { type LoginInput } from "@/features/auth/types/auth.types";
import type { RequestOptions } from "@/services/api-client";
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
};
