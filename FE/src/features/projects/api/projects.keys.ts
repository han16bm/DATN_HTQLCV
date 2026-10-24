import {
  type ProjectHistoryQuery,
  type ProjectQuery,
} from "@/features/projects/types/projects.types";
export const projectsKeys = {
  all: ["projects"] as const,
  viewer: (viewerId: string) => ["projects", viewerId] as const,
  listProjects: (viewerId: string, query: ProjectQuery) =>
    ["projects", viewerId, "listProjects", query] as const,
  getProject: (viewerId: string, projectId: string) =>
    ["projects", viewerId, "getProject", projectId] as const,
  getProjectClosureChecks: (viewerId: string, projectId: string) =>
    ["projects", viewerId, "getProjectClosureChecks", projectId] as const,
  listProjectHistory: (
    viewerId: string,
    projectId: string,
    query: ProjectHistoryQuery,
  ) => ["projects", viewerId, "listProjectHistory", projectId, query] as const,
};
