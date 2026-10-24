import type { ProjectsApi } from "@/features/projects/api/projects.contract";
import {
  getProjectClosureChecksResultSchema,
  projectSchema,
} from "@/features/projects/schemas/projects.schema";
import {
  type CancelProjectInput,
  type CreateProjectInput,
  type ProjectHistoryQuery,
  type ProjectQuery,
  type UpdateProjectInput,
} from "@/features/projects/types/projects.types";
import { auditSchema, page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export const projectsService: ProjectsApi = {
  listProjects(query: ProjectQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/projects`, page(projectSchema), {
      ...options,
      query,
    });
  },
  getProject(projectId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/projects/${encodeURIComponent(projectId)}`,
      projectSchema,
      options,
    );
  },
  createProject(payload: CreateProjectInput, options: MutationOptions) {
    return apiClient.post(`/projects`, payload, projectSchema, options);
  },
  updateProject(
    projectId: string,
    payload: UpdateProjectInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/projects/${encodeURIComponent(projectId)}`,
      payload,
      projectSchema,
      options,
    );
  },
  activateProject(projectId: string, options: VersionOptions) {
    return apiClient.post(
      `/projects/${encodeURIComponent(projectId)}/activate`,
      {},
      projectSchema,
      options,
    );
  },
  getProjectClosureChecks(projectId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/projects/${encodeURIComponent(projectId)}/closure-checks`,
      getProjectClosureChecksResultSchema,
      options,
    );
  },
  completeProject(projectId: string, options: VersionOptions) {
    return apiClient.post(
      `/projects/${encodeURIComponent(projectId)}/complete`,
      {},
      projectSchema,
      options,
    );
  },
  cancelProject(
    projectId: string,
    payload: CancelProjectInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/projects/${encodeURIComponent(projectId)}/cancel`,
      payload,
      projectSchema,
      options,
    );
  },
  listProjectHistory(
    projectId: string,
    query: ProjectHistoryQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient.get(
      `/projects/${encodeURIComponent(projectId)}/history`,
      page(auditSchema),
      { ...options, query },
    );
  },
};
