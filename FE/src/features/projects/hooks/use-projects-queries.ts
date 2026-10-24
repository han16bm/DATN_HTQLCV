"use client";
import {
  projectHistoryQuerySchema,
  projectQuerySchema,
} from "@/features/projects/schemas/projects.schema";
import {
  type ProjectHistoryQuery,
  type ProjectQuery,
} from "@/features/projects/types/projects.types";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { idSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { projectsKeys } from "../api/projects.keys";
import { projectsService } from "../api/projects.service";

export function useListProjectsQuery(
  query: ProjectQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = projectQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? projectsKeys.listProjects(session?.user.id ?? "anonymous", filters)
      : [
          "projects",
          session?.user.id ?? "anonymous",
          "listProjects",
          "invalid-query",
        ],
    queryFn: ({ signal }) => projectsService.listProjects(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "projects");
}
export function useGetProjectQuery(
  projectId: string,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: projectsKeys.getProject(
      session?.user.id ?? "anonymous",
      projectId,
    ),
    queryFn: ({ signal }) => projectsService.getProject(projectId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(projectId).success,
    staleTime: 10000,
  });
  return useQueryAccess(result, "projects");
}
export function useGetProjectClosureChecksQuery(
  projectId: string,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: projectsKeys.getProjectClosureChecks(
      session?.user.id ?? "anonymous",
      projectId,
    ),
    queryFn: ({ signal }) =>
      projectsService.getProjectClosureChecks(projectId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(projectId).success &&
      hasPermission(session, "PROJECT_MANAGE", projectId),
    staleTime: 0,
  });
  return useQueryAccess(result, "projects");
}
export function useListProjectHistoryQuery(
  projectId: string,
  query: ProjectHistoryQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = projectHistoryQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? projectsKeys.listProjectHistory(
          session?.user.id ?? "anonymous",
          projectId,
          filters,
        )
      : [
          "projects",
          session?.user.id ?? "anonymous",
          "listProjectHistory",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      projectsService.listProjectHistory(projectId, filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      idSchema.safeParse(projectId).success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "projects");
}
