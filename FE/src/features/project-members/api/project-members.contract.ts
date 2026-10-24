import {
  type AddProjectMemberInput,
  type EndProjectMembershipInput,
  type MembershipDto,
  type ProjectMemberList,
  type ProjectMemberQuery,
  type UpdateProjectMemberPermissionsInput,
} from "@/features/project-members/types/project-members.types";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export interface ProjectMembersApi {
  listProjectMembers(
    projectId: string,
    query?: ProjectMemberQuery,
    options?: RequestOptions,
  ): Promise<ProjectMemberList>;
  addProjectMember(
    projectId: string,
    payload: AddProjectMemberInput,
    options: MutationOptions,
  ): Promise<MembershipDto>;
  updateProjectMemberPermissions(
    projectId: string,
    membershipId: string,
    payload: UpdateProjectMemberPermissionsInput,
    options: VersionOptions,
  ): Promise<MembershipDto>;
  endProjectMembership(
    projectId: string,
    membershipId: string,
    payload: EndProjectMembershipInput,
    options: VersionOptions,
  ): Promise<MembershipDto>;
}
