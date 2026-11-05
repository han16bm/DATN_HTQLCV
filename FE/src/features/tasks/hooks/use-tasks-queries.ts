"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { tasksKeys } from "../api/tasks.keys";
import { tasksService } from "../api/tasks.service";
import {
  taskHistoryQuerySchema,
  taskQuerySchema,
} from "../schemas/task.schema";
import { type TaskHistoryQuery, type TaskQuery } from "../types/tasks.types";

export function useListTasksQuery(query: TaskQuery = {}) {
  const viewerId = useSession().session?.user.id;

  const filters = taskQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: tasksKeys.listTasks(viewerId, filters),
    queryFn: ({ signal }) => tasksService.listTasks(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "tasks");
}

export function useGetTaskQuery(taskId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: tasksKeys.getTask(viewerId, taskId),
    queryFn: ({ signal }) => tasksService.getTask(taskId, { signal }),
    enabled: Boolean(viewerId && taskId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "tasks");
}

export function useListTaskHistoryQuery(
  taskId: string,
  query: TaskHistoryQuery = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = taskHistoryQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: tasksKeys.listTaskHistory(viewerId, taskId, filters),
    queryFn: ({ signal }) =>
      tasksService.listTaskHistory(taskId, filters, { signal }),
    enabled: Boolean(viewerId && taskId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "tasks");
}
