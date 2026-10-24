// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./tasks.contract";
export const tasksKeys = {
  all: ["tasks"] as const,
  viewer: (viewerId: string) => ["tasks", viewerId] as const,
  listTasks: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "tasks",
      viewerId,
      "listTasks",
      params,
      normalizeQuery(contracts.listTasksContract.query.parse(query)),
    ] as const,
  getTask: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "tasks",
      viewerId,
      "getTask",
      params,
      normalizeQuery(contracts.getTaskContract.query.parse(query)),
    ] as const,
  listTaskHistory: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "tasks",
      viewerId,
      "listTaskHistory",
      params,
      normalizeQuery(contracts.listTaskHistoryContract.query.parse(query)),
    ] as const,
};
