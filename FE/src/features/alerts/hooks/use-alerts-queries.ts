"use client";
import { alertQuerySchema } from "@/features/alerts/schemas/alerts.schema";
import { type AlertQuery } from "@/features/alerts/types/alerts.types";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { idSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { alertsKeys } from "../api/alerts.keys";
import { alertsService } from "../api/alerts.service";

export function useListAlertsQuery(
  query: AlertQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = alertQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? alertsKeys.listAlerts(session?.user.id ?? "anonymous", filters)
      : [
          "alerts",
          session?.user.id ?? "anonymous",
          "listAlerts",
          "invalid-query",
        ],
    queryFn: ({ signal }) => alertsService.listAlerts(filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      hasPermission(session, "ANALYTICS_VIEW", filters.projectId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "alerts");
}
export function useGetAlertQuery(alertId: string, options: QueryOptions = {}) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: alertsKeys.getAlert(session?.user.id ?? "anonymous", alertId),
    queryFn: ({ signal }) => alertsService.getAlert(alertId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(alertId).success &&
      hasPermission(session, "ANALYTICS_VIEW"),
    staleTime: 10000,
  });
  return useQueryAccess(result, "alerts");
}
