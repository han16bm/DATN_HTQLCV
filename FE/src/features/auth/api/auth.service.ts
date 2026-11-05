import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
  token,
} from "@/services/api-client";
import { passwordResultSchema } from "../schemas/password.schema";
import { personalProfileSchema } from "../schemas/profile.schema";
import {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "../schemas/session.schema";
import type {
  ChangePasswordInput,
  ChangePasswordResult,
  LoginInput,
  LoginResponse,
  LogoutResult,
  SessionDto,
  PersonalProfileDto,
  UpdateProfileInput,
} from "../types/auth.types";

export const authService = {
  async login(payload: LoginInput) {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
      { skipAuthRefresh: true, schema: loginResponseSchema },
    );
    token.set(response.data.accessToken);
    return response.data.session;
  },

  async logout() {
    const response = await apiClient.post<LogoutResult>(
      "/auth/logout",
      {},
      { skipAuthRefresh: true, schema: logoutResultSchema },
    );
    return response.data;
  },

  async refreshSession() {
    const response = await apiClient.post<LoginResponse>(
      "/auth/refresh",
      {},
      { skipAuthRefresh: true, schema: loginResponseSchema },
    );
    token.set(response.data.accessToken);
    return response.data.session;
  },

  async getSession(options: RequestOptions = {}) {
    const response = await apiClient.get<SessionDto>("/auth/me", {
      ...options,
      skipAuthRefresh: true,
      schema: sessionSchema,
    });
    return response.data;
  },

  async getProfile(options: RequestOptions = {}) {
    const response = await apiClient.get<PersonalProfileDto>("/auth/me/profile", {
      ...options,
      schema: personalProfileSchema,
    });
    return response.data;
  },

  async updateProfile(payload: UpdateProfileInput, options: VersionOptions) {
    const form = new FormData();
    for (const [name, value] of Object.entries(payload)) {
      if (value !== undefined) form.set(name, value ?? "");
    }
    const response = await apiClient.patch<SessionDto>("/auth/me", form, {
      ...options,
      schema: sessionSchema,
    });
    return response.data;
  },

  async changePassword(payload: ChangePasswordInput, options: MutationOptions) {
    const response = await apiClient.put<ChangePasswordResult>(
      "/auth/me/password",
      payload,
      { ...options, schema: passwordResultSchema },
    );
    if (response.data.accessToken) token.set(response.data.accessToken);
    return response.data;
  },
};
