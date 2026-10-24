import type { ProjectMembersApi } from "@/features/project-members/api/project-members.contract";
import { membershipSchema } from "@/features/project-members/schemas/project-members.schema";
import {
  type AddProjectMemberInput,
  type EndProjectMembershipInput,
  type ProjectMemberQuery,
  type UpdateProjectMemberPermissionsInput,
} from "@/features/project-members/types/project-members.types";
import { page } from "@/lib/validation/common.schema";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const projectMembersService: ProjectMembersApi = {
  listProjectMembers(
    projectId: string,
    query: ProjectMemberQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>(`/projects/${encodeURIComponent(projectId)}/members`, {
        ...options,
        params: query,
      })
      .then(parseResponse(page(membershipSchema)));
  },
  addProjectMember(
    projectId: string,
    payload: AddProjectMemberInput,
    options: MutationOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/projects/${encodeURIComponent(projectId)}/members`,
        payload,
        options,
      )
      .then(parseResponse(membershipSchema));
  },
  updateProjectMemberPermissions(
    projectId: string,
    membershipId: string,
    payload: UpdateProjectMemberPermissionsInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(
        `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(membershipId)}`,
        payload,
        options,
      )
      .then(parseResponse(membershipSchema));
  },
  endProjectMembership(
    projectId: string,
    membershipId: string,
    payload: EndProjectMembershipInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(membershipId)}/end`,
        payload,
        options,
      )
      .then(parseResponse(membershipSchema));
  },
};
