import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { z } from "zod";
import { featureSchema } from "../schemas/feature.schema";
import { permissionGroupSchema } from "../schemas/permission-group.schema";
import { projectRolePolicySchema } from "../schemas/project-role-policy.schema";
import type {
  CreatePermissionGroupInput,
  FeatureDto,
  PermissionGroupDto,
  PermissionGroupList,
  PermissionGroupQuery,
  ReplacePermissionGroupMembersInput,
  SetPermissionGroupStatusArgs,
  UpdateFeatureInput,
  UpdatePermissionGroupInput,
  ProjectRolePolicyDto,
  UpdateProjectRolePolicyInput,
} from "../types/permissions.types";

export const permissionsService = {
  async listFeatures(options: RequestOptions = {}) {
    const response = await apiClient.get<FeatureDto[]>("/features", {
      ...options,
      schema: z.array(featureSchema),
    });
    return response.data;
  },

  async updateFeature(
    code: string,
    payload: UpdateFeatureInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<FeatureDto>(
      `/features/${encodeURIComponent(code)}`,
      payload,
      { ...options, schema: featureSchema },
    );
    return response.data;
  },

  // Ma trận quyền theo vai trò dự án (ADMIN_MODULES §11): OWNER cố định, MANAGER/MEMBER chỉnh được.
  async listProjectRolePolicies(options: RequestOptions = {}) {
    const response = await apiClient.get<ProjectRolePolicyDto[]>(
      "/project-role-policies",
      { ...options, schema: z.array(projectRolePolicySchema) },
    );
    return response.data;
  },

  async updateProjectRolePolicy(
    role: ProjectRolePolicyDto["role"],
    payload: UpdateProjectRolePolicyInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<ProjectRolePolicyDto>(
      `/project-role-policies/${encodeURIComponent(role)}`,
      payload,
      { ...options, schema: projectRolePolicySchema },
    );
    return response.data;
  },

  async listPermissionGroups(
    query: PermissionGroupQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<PermissionGroupList>(
      "/permission-groups",
      { ...options, params: query, schema: page(permissionGroupSchema) },
    );
    return response.data;
  },

  async getPermissionGroup(groupId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}`,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async createPermissionGroup(
    payload: CreatePermissionGroupInput,
    options: MutationOptions,
  ) {
    const response = await apiClient.post<PermissionGroupDto>(
      "/permission-groups",
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async updatePermissionGroup(
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

  async replacePermissionGroupMembers(
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

  async deactivatePermissionGroup(
    groupId: string,
    payload: SetPermissionGroupStatusArgs["payload"],
    options: VersionOptions,
  ) {
    const response = await apiClient.post<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}/deactivate`,
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },

  async activatePermissionGroup(
    groupId: string,
    payload: SetPermissionGroupStatusArgs["payload"],
    options: VersionOptions,
  ) {
    const response = await apiClient.post<PermissionGroupDto>(
      `/permission-groups/${encodeURIComponent(groupId)}/activate`,
      payload,
      { ...options, schema: permissionGroupSchema },
    );
    return response.data;
  },
};
