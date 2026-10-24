"use client";
import { projectMemberQuerySchema } from "@/features/project-members/schemas/project-members.schema";
import { type ProjectMemberQuery } from "@/features/project-members/types/project-members.types";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { idSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { projectMembersKeys } from "../api/project-members.keys";
import { projectMembersService } from "../api/project-members.service";

export function useListProjectMembersQuery(
  projectId: string,
  query: ProjectMemberQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = projectMemberQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? projectMembersKeys.listProjectMembers(
          session?.user.id ?? "anonymous",
          projectId,
          filters,
        )
      : [
          "project-members",
          session?.user.id ?? "anonymous",
          "listProjectMembers",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      projectMembersService.listProjectMembers(projectId, filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      idSchema.safeParse(projectId).success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "project-members");
}
