// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./projects.contract";
export const projectsKeys = {
  all: ["projects"] as const,
  viewer: (viewerId: string) => ["projects", viewerId] as const,
  listProjects: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "projects",
      viewerId,
      "listProjects",
      params,
      normalizeQuery(contracts.listProjectsContract.query.parse(query)),
    ] as const,
  getProject: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "projects",
      viewerId,
      "getProject",
      params,
      normalizeQuery(contracts.getProjectContract.query.parse(query)),
    ] as const,
  getProjectClosureChecks: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "projects",
      viewerId,
      "getProjectClosureChecks",
      params,
      normalizeQuery(
        contracts.getProjectClosureChecksContract.query.parse(query),
      ),
    ] as const,
  listProjectHistory: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "projects",
      viewerId,
      "listProjectHistory",
      params,
      normalizeQuery(contracts.listProjectHistoryContract.query.parse(query)),
    ] as const,
};
