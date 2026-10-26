import type { ViewerId } from "@/types/common";
import {
  type ProjectHistoryQuery,
  type ProjectQuery,
} from "../types/projects.types";
export const projectsKeys = {
  all: ["projects"] as const,
  viewer: (viewerId: ViewerId) =>
    ["projects", viewerId ?? "anonymous"] as const,
  listProjects: (viewerId: ViewerId, query: ProjectQuery) =>
    [...projectsKeys.viewer(viewerId), "listProjects", query] as const,
  getProject: (viewerId: ViewerId, projectId: string) =>
    [...projectsKeys.viewer(viewerId), "getProject", projectId] as const,
  getProjectClosureChecks: (viewerId: ViewerId, projectId: string) =>
    [
      ...projectsKeys.viewer(viewerId),
      "getProjectClosureChecks",
      projectId,
    ] as const,
  listProjectHistory: (
    viewerId: ViewerId,
    projectId: string,
    query: ProjectHistoryQuery,
  ) =>
    [
      ...projectsKeys.viewer(viewerId),
      "listProjectHistory",
      projectId,
      query,
    ] as const,
};
