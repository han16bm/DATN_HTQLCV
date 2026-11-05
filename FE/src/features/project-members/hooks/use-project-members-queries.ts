"use client";

import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { projectMembersKeys } from "../api/project-members.keys";
import { projectMembersService } from "../api/project-members.service";
import { projectMemberQuerySchema } from "../schemas/project-members.schema";
import { type ProjectMemberQuery } from "../types/project-members.types";

export function useListProjectMembersQuery(
  projectId: string,
  query: ProjectMemberQuery = {},
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = projectMemberQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: projectMembersKeys.listProjectMembers(
      viewerId,
      projectId,
      filters,
    ),
    queryFn: ({ signal }) =>
      projectMembersService.listProjectMembers(projectId, filters, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId && projectId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "project-members");
}
