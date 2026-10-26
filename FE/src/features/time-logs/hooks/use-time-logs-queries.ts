"use client";

import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { timeLogsKeys } from "../api/time-logs.keys";
import { timeLogsService } from "../api/time-logs.service";
import { timeLogQuerySchema } from "../schemas/time-logs.schema";
import { type TimeLogQuery } from "../types/time-logs.types";

export function useListTimeLogsQuery(
  taskId: string,
  query: TimeLogQuery = {},
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = timeLogQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: timeLogsKeys.listTimeLogs(viewerId, taskId, filters),
    queryFn: ({ signal }) =>
      timeLogsService.listTimeLogs(taskId, filters, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId && taskId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "time-logs");
}
