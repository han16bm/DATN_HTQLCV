import type { ProjectsApi } from "@/features/projects/api/projects.contract";
import {
  getProjectClosureChecksResultSchema,
  projectRowSchema,
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
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const projectsService: ProjectsApi = {
  listProjects(query: ProjectQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/projects", { ...options, params: query })
      .then(parseResponse(page(projectRowSchema)));
  },
  getProject(projectId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/projects/${encodeURIComponent(projectId)}`, options)
      .then(parseResponse(projectSchema));
  },
  createProject(payload: CreateProjectInput, options: MutationOptions) {
    return apiClient
      .post<unknown>("/projects", payload, options)
      .then(parseResponse(projectSchema));
  },
  updateProject(
    projectId: string,
    payload: UpdateProjectInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(
        `/projects/${encodeURIComponent(projectId)}`,
        payload,
        options,
      )
      .then(parseResponse(projectSchema));
  },
  activateProject(projectId: string, options: VersionOptions) {
    return apiClient
      .post<unknown>(
        `/projects/${encodeURIComponent(projectId)}/activate`,
        {},
        options,
      )
      .then(parseResponse(projectSchema));
  },
  getProjectClosureChecks(projectId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(
        `/projects/${encodeURIComponent(projectId)}/closure-checks`,
        options,
      )
      .then(parseResponse(getProjectClosureChecksResultSchema));
  },
  completeProject(projectId: string, options: VersionOptions) {
    return apiClient
      .post<unknown>(
        `/projects/${encodeURIComponent(projectId)}/complete`,
        {},
        options,
      )
      .then(parseResponse(projectSchema));
  },
  cancelProject(
    projectId: string,
    payload: CancelProjectInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/projects/${encodeURIComponent(projectId)}/cancel`,
        payload,
        options,
      )
      .then(parseResponse(projectSchema));
  },
  listProjectHistory(
    projectId: string,
    query: ProjectHistoryQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>(`/projects/${encodeURIComponent(projectId)}/history`, {
        ...options,
        params: query,
      })
      .then(parseResponse(page(auditSchema)));
  },
};
