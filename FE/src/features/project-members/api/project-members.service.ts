import type { ProjectMembersApi } from "@/features/project-members/api/project-members.contract";
import { membershipSchema } from "@/features/project-members/schemas/project-members.schema";
import {
  type AddProjectMemberInput,
  type EndProjectMembershipInput,
  type ProjectMemberQuery,
  type UpdateProjectMemberPermissionsInput,
} from "@/features/project-members/types/project-members.types";
import { page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export const projectMembersService: ProjectMembersApi = {
  listProjectMembers(
    projectId: string,
    query: ProjectMemberQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient.get(
      `/projects/${encodeURIComponent(projectId)}/members`,
      page(membershipSchema),
      { ...options, query },
    );
  },
  addProjectMember(
    projectId: string,
    payload: AddProjectMemberInput,
    options: MutationOptions,
  ) {
    return apiClient.post(
      `/projects/${encodeURIComponent(projectId)}/members`,
      payload,
      membershipSchema,
      options,
    );
  },
  updateProjectMemberPermissions(
    projectId: string,
    membershipId: string,
    payload: UpdateProjectMemberPermissionsInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(membershipId)}`,
      payload,
      membershipSchema,
      options,
    );
  },
  endProjectMembership(
    projectId: string,
    membershipId: string,
    payload: EndProjectMembershipInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(membershipId)}/end`,
      payload,
      membershipSchema,
      options,
    );
  },
};
