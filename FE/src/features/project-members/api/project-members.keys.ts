import type { ViewerId } from "@/types/common";
import { type ProjectMemberQuery } from "../types/project-members.types";
export const projectMembersKeys = {
  all: ["project-members"] as const,
  viewer: (viewerId: ViewerId) =>
    ["project-members", viewerId ?? "anonymous"] as const,
  listProjectMembers: (
    viewerId: ViewerId,
    projectId: string,
    query: ProjectMemberQuery,
  ) =>
    [
      ...projectMembersKeys.viewer(viewerId),
      "listProjectMembers",
      projectId,
      query,
    ] as const,
};
