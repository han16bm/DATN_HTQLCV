import { type ProjectMemberQuery } from "@/features/project-members/types/project-members.types";
export const projectMembersKeys = {
  all: ["project-members"] as const,
  viewer: (viewerId: string) => ["project-members", viewerId] as const,
  listProjectMembers: (
    viewerId: string,
    projectId: string,
    query: ProjectMemberQuery,
  ) =>
    [
      "project-members",
      viewerId,
      "listProjectMembers",
      projectId,
      query,
    ] as const,
};
