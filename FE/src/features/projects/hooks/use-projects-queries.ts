"use client";

import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { projectsKeys } from "../api/projects.keys";
import { projectsService } from "../api/projects.service";
import {
  projectHistoryQuerySchema,
  projectQuerySchema,
} from "../schemas/projects.schema";
import {
  type ProjectHistoryQuery,
  type ProjectQuery,
} from "../types/projects.types";

export function useListProjectsQuery(query: ProjectQuery = {}) {
  const viewerId = useSession().session?.user.id;

  const filters = projectQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: projectsKeys.listProjects(viewerId, filters),
    queryFn: ({ signal }) => projectsService.listProjects(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "projects");
}

export function useGetProjectQuery(projectId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: projectsKeys.getProject(viewerId, projectId),
    queryFn: ({ signal }) => projectsService.getProject(projectId, { signal }),
    enabled: Boolean(viewerId && projectId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "projects");
}

export function useGetProjectClosureChecksQuery(
  projectId: string,
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: projectsKeys.getProjectClosureChecks(viewerId, projectId),
    queryFn: ({ signal }) =>
      projectsService.getProjectClosureChecks(projectId, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId && projectId),
    staleTime: 0,
  });
  return useQueryAccess(result, "projects");
}

export function useListProjectHistoryQuery(
  projectId: string,
  query: ProjectHistoryQuery = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = projectHistoryQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: projectsKeys.listProjectHistory(viewerId, projectId, filters),
    queryFn: ({ signal }) =>
      projectsService.listProjectHistory(projectId, filters, { signal }),
    enabled: Boolean(viewerId && projectId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "projects");
}
