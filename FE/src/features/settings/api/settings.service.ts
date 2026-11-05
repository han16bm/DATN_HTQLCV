import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { z } from "zod";
import { settingSchema } from "../schemas/setting.schema";
import type {
  CreateSettingInput,
  SettingDto,
  SettingQuery,
  UpdateSettingInput,
} from "../types/settings.types";

export const settingsService = {
  async listSettings(query: SettingQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<SettingDto[]>("/settings", {
      ...options,
      params: query,
      schema: z.array(settingSchema),
    });
    return response.data;
  },

  async createSetting(payload: CreateSettingInput, options: MutationOptions) {
    const response = await apiClient.post<SettingDto>("/settings", payload, {
      ...options,
      schema: settingSchema,
    });
    return response.data;
  },

  async updateSetting(
    settingId: string,
    payload: UpdateSettingInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<SettingDto>(
      `/settings/${encodeURIComponent(settingId)}`,
      payload,
      { ...options, schema: settingSchema },
    );
    return response.data;
  },
};
