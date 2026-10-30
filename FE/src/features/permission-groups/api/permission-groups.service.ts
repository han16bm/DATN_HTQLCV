import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { permissionGroupSchema } from "../schemas/permission-group.schema";
import type {
  CreatePermissionGroupInput,
  DeactivatePermissionGroupInput,
  PermissionGroupDto,
  PermissionGroupList,
  PermissionGroupQuery,
  ReplacePermissionGroupMembersInput,
  UpdatePermissionGroupInput,
} from "../types/permission-group.types";

export const permissionGroupService = {
  async list(query: PermissionGroupQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<PermissionGroupList>(
      "/permission-groups",
      { ...options, params: query, schema: page(permissionGroupSchema) },
    );
    return response.data;
  },

  async get(groupId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}`,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async create(payload: CreatePermissionGroupInput, options: MutationOptions) {
    const response = await apiClient.post<PermissionGroupDto>(
      "/permission-groups",
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async update(
    groupId: string,
    payload: UpdatePermissionGroupInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}`,
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async replaceMembers(
    groupId: string,
    payload: ReplacePermissionGroupMembersInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.put<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}/members`,
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async deactivate(
    groupId: string,
    payload: DeactivatePermissionGroupInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}/deactivate`,
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },
};
