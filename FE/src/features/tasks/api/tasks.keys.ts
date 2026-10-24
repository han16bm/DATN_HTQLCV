import {
  type TaskHistoryQuery,
  type TaskQuery,
} from "@/features/tasks/types/tasks.types";
export const tasksKeys = {
  all: ["tasks"] as const,
  viewer: (viewerId: string) => ["tasks", viewerId] as const,
  listTasks: (viewerId: string, query: TaskQuery) =>
    ["tasks", viewerId, "listTasks", query] as const,
  getTask: (viewerId: string, taskId: string) =>
    ["tasks", viewerId, "getTask", taskId] as const,
  listTaskHistory: (
    viewerId: string,
    taskId: string,
    query: TaskHistoryQuery,
  ) => ["tasks", viewerId, "listTaskHistory", taskId, query] as const,
};
