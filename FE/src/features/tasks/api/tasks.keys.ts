import type { ViewerId } from "@/types/common";
import { type TaskHistoryQuery, type TaskQuery } from "../types/tasks.types";
export const tasksKeys = {
  all: ["tasks"] as const,
  viewer: (viewerId: ViewerId) => ["tasks", viewerId ?? "anonymous"] as const,
  listTasks: (viewerId: ViewerId, query: TaskQuery) =>
    [...tasksKeys.viewer(viewerId), "listTasks", query] as const,
  getTask: (viewerId: ViewerId, taskId: string) =>
    [...tasksKeys.viewer(viewerId), "getTask", taskId] as const,
  listTaskHistory: (
    viewerId: ViewerId,
    taskId: string,
    query: TaskHistoryQuery,
  ) =>
    [...tasksKeys.viewer(viewerId), "listTaskHistory", taskId, query] as const,
};
