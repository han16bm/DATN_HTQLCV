import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { membershipSchema } from "../schemas/project-members.schema";
import type {
  AddProjectMemberInput,
  EndProjectMembershipInput,
  MembershipDto,
  ProjectMemberList,
  ProjectMemberQuery,
  UpdateProjectMemberRoleInput,
} from "../types/project-members.types";

export const projectMembersService = {
  async listProjectMembers(
    projectId: string,
    query: ProjectMemberQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<ProjectMemberList>(
      `/projects/${encodeURIComponent(projectId)}/members`,
      { ...options, params: query, schema: page(membershipSchema) },
    );
    return response.data;
  },

  async addProjectMember(
    projectId: string,
    payload: AddProjectMemberInput,
    options: MutationOptions,
  ) {
    const response = await apiClient.post<MembershipDto>(
      `/projects/${encodeURIComponent(projectId)}/members`,
      payload,
      { ...options, schema: membershipSchema },
    );
    return response.data;
  },

  async updateProjectMemberRole(
    projectId: string,
    membershipId: string,
    payload: UpdateProjectMemberRoleInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<MembershipDto>(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(membershipId)}`,
      payload,
      { ...options, schema: membershipSchema },
    );
    return response.data;
  },

  async endProjectMembership(
    projectId: string,
    membershipId: string,
    payload: EndProjectMembershipInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<MembershipDto>(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(membershipId)}/end`,
      payload,
      { ...options, schema: membershipSchema },
    );
    return response.data;
  },
};
