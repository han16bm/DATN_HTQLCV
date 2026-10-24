"use client";
import { timeLogQuerySchema } from "@/features/time-logs/schemas/time-logs.schema";
import { type TimeLogQuery } from "@/features/time-logs/types/time-logs.types";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { queryIdSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { timeLogsKeys } from "../api/time-logs.keys";
import { timeLogsService } from "../api/time-logs.service";

export function useListTimeLogsQuery(
  taskId: string,
  query: TimeLogQuery = {},
  options: QueryOptions = {},
) {
  const id = queryIdSchema.parse(taskId);
  const { session } = useSession();
  const parsed = timeLogQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? timeLogsKeys.listTimeLogs(session?.user.id ?? "anonymous", id, filters)
      : [
          "time-logs",
          session?.user.id ?? "anonymous",
          "listTimeLogs",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      timeLogsService.listTimeLogs(id, filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      Boolean(id),
    staleTime: 30000,
  });
  return useQueryAccess(result, "time-logs");
}
