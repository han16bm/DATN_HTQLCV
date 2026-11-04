import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import {
  ipWhitelistEntrySchema,
  ipWhitelistSchema,
} from "../schemas/ip-whitelist.schema";
import type {
  CreateIpWhitelistEntryInput,
  IpWhitelistDto,
  IpWhitelistEntryDto,
  UpdateIpWhitelistEntryInput,
} from "../types/ip-whitelist.types";

export const ipWhitelistService = {
  async getIpWhitelist(options: RequestOptions = {}) {
    const response = await apiClient.get<IpWhitelistDto>("/ip-whitelist", {
      ...options,
      schema: ipWhitelistSchema,
    });
    return response.data;
  },

  async createIpWhitelistEntry(
    payload: CreateIpWhitelistEntryInput,
    options: MutationOptions,
  ) {
    const response = await apiClient.post<IpWhitelistEntryDto>(
      "/ip-whitelist",
      payload,
      { ...options, schema: ipWhitelistEntrySchema },
    );
    return response.data;
  },

  async updateIpWhitelistEntry(
    entryId: string,
    payload: UpdateIpWhitelistEntryInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<IpWhitelistEntryDto>(
      `/ip-whitelist/${encodeURIComponent(entryId)}`,
      payload,
      { ...options, schema: ipWhitelistEntrySchema },
    );
    return response.data;
  },

  // Không đọc thân phản hồi (BE có thể trả 204) nên không khai báo schema.
  async deleteIpWhitelistEntry(entryId: string, options: VersionOptions) {
    await apiClient.delete<unknown>(
      `/ip-whitelist/${encodeURIComponent(entryId)}`,
      options,
    );
  },
};
