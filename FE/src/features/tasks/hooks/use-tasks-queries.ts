"use client";
import {
  taskHistoryQuerySchema,
  taskQuerySchema,
} from "@/features/tasks/schemas/task.schema";
import {
  type TaskHistoryQuery,
  type TaskQuery,
} from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { queryIdSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { tasksKeys } from "../api/tasks.keys";
import { tasksService } from "../api/tasks.service";

export function useListTasksQuery(
  query: TaskQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = taskQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? tasksKeys.listTasks(session?.user.id ?? "anonymous", filters)
      : [
          "tasks",
          session?.user.id ?? "anonymous",
          "listTasks",
          "invalid-query",
        ],
    queryFn: ({ signal }) => tasksService.listTasks(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "tasks");
}
export function useGetTaskQuery(taskId: string, options: QueryOptions = {}) {
  const id = queryIdSchema.parse(taskId);
  const { session } = useSession();
  const result = useQuery({
    queryKey: tasksKeys.getTask(session?.user.id ?? "anonymous", id),
    queryFn: ({ signal }) => tasksService.getTask(id, { signal }),
    enabled: options.enabled !== false && Boolean(session) && Boolean(id),
    staleTime: 10000,
  });
  return useQueryAccess(result, "tasks");
}
export function useListTaskHistoryQuery(
  taskId: string,
  query: TaskHistoryQuery = {},
  options: QueryOptions = {},
) {
  const id = queryIdSchema.parse(taskId);
  const { session } = useSession();
  const parsed = taskHistoryQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? tasksKeys.listTaskHistory(session?.user.id ?? "anonymous", id, filters)
      : [
          "tasks",
          session?.user.id ?? "anonymous",
          "listTaskHistory",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      tasksService.listTaskHistory(id, filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      Boolean(id),
    staleTime: 30000,
  });
  return useQueryAccess(result, "tasks");
}
