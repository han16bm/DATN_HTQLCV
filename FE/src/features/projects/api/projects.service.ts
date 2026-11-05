import { auditSchema, page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import {
  getProjectClosureChecksResultSchema,
  projectRowSchema,
  projectSchema,
} from "../schemas/projects.schema";
import type {
  CancelProjectInput,
  CreateProjectInput,
  TransferProjectOwnerInput,
  GetProjectClosureChecksResult,
  ProjectDto,
  ProjectHistoryList,
  ProjectHistoryQuery,
  ProjectList,
  ProjectQuery,
  UpdateProjectInput,
} from "../types/projects.types";

export const projectsService = {
  async listProjects(query: ProjectQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<ProjectList>("/projects", {
      ...options,
      params: query,
      schema: page(projectRowSchema),
    });
    return response.data;
  },

  async getProject(projectId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<ProjectDto>(
      `/projects/${encodeURIComponent(projectId)}`,
      { ...options, schema: projectSchema },
    );
    return response.data;
  },

  async createProject(payload: CreateProjectInput, options: MutationOptions) {
    const response = await apiClient.post<ProjectDto>("/projects", payload, {
      ...options,
      schema: projectSchema,
    });
    return response.data;
  },

  async updateProject(
    projectId: string,
    payload: UpdateProjectInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<ProjectDto>(
      `/projects/${encodeURIComponent(projectId)}`,
      payload,
      { ...options, schema: projectSchema },
    );
    return response.data;
  },

  async activateProject(projectId: string, options: VersionOptions) {
    const response = await apiClient.post<ProjectDto>(
      `/projects/${encodeURIComponent(projectId)}/activate`,
      {},
      { ...options, schema: projectSchema },
    );
    return response.data;
  },

  async getProjectClosureChecks(
    projectId: string,
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<GetProjectClosureChecksResult>(
      `/projects/${encodeURIComponent(projectId)}/closure-checks`,
      { ...options, schema: getProjectClosureChecksResultSchema },
    );
    return response.data;
  },

  async completeProject(projectId: string, options: VersionOptions) {
    const response = await apiClient.post<ProjectDto>(
      `/projects/${encodeURIComponent(projectId)}/complete`,
      {},
      { ...options, schema: projectSchema },
    );
    return response.data;
  },

  async cancelProject(
    projectId: string,
    payload: CancelProjectInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<ProjectDto>(
      `/projects/${encodeURIComponent(projectId)}/cancel`,
      payload,
      { ...options, schema: projectSchema },
    );
    return response.data;
  },

  async transferProjectOwner(
    projectId: string,
    payload: TransferProjectOwnerInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<ProjectDto>(
      `/projects/${encodeURIComponent(projectId)}/transfer-owner`,
      payload,
      { ...options, schema: projectSchema },
    );
    return response.data;
  },

  async listProjectHistory(
    projectId: string,
    query: ProjectHistoryQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<ProjectHistoryList>(
      `/projects/${encodeURIComponent(projectId)}/history`,
      { ...options, params: query, schema: page(auditSchema) },
    );
    return response.data;
  },
};
