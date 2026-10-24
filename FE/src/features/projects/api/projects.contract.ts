import {
  type CancelProjectInput,
  type CreateProjectInput,
  type GetProjectClosureChecksResult,
  type ProjectDto,
  type ProjectHistoryList,
  type ProjectHistoryQuery,
  type ProjectList,
  type ProjectQuery,
  type UpdateProjectInput,
} from "@/features/projects/types/projects.types";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export interface ProjectsApi {
  listProjects(
    query?: ProjectQuery,
    options?: RequestOptions,
  ): Promise<ProjectList>;
  getProject(projectId: string, options?: RequestOptions): Promise<ProjectDto>;
  createProject(
    payload: CreateProjectInput,
    options: MutationOptions,
  ): Promise<ProjectDto>;
  updateProject(
    projectId: string,
    payload: UpdateProjectInput,
    options: VersionOptions,
  ): Promise<ProjectDto>;
  activateProject(
    projectId: string,
    options: VersionOptions,
  ): Promise<ProjectDto>;
  getProjectClosureChecks(
    projectId: string,
    options?: RequestOptions,
  ): Promise<GetProjectClosureChecksResult>;
  completeProject(
    projectId: string,
    options: VersionOptions,
  ): Promise<ProjectDto>;
  cancelProject(
    projectId: string,
    payload: CancelProjectInput,
    options: VersionOptions,
  ): Promise<ProjectDto>;
  listProjectHistory(
    projectId: string,
    query?: ProjectHistoryQuery,
    options?: RequestOptions,
  ): Promise<ProjectHistoryList>;
}
