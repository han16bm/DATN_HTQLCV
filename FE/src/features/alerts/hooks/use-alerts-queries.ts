"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { alertsKeys } from "../api/alerts.keys";
import { alertsService } from "../api/alerts.service";
import { alertQuerySchema } from "../schemas/alerts.schema";
import { type AlertQuery } from "../types/alerts.types";

export function useListAlertsQuery(query: AlertQuery = {}) {
  const viewerId = useSession().session?.user.id;

  const filters = alertQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: alertsKeys.listAlerts(viewerId, filters),
    queryFn: ({ signal }) => alertsService.listAlerts(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "alerts");
}

export function useGetAlertQuery(alertId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: alertsKeys.getAlert(viewerId, alertId),
    queryFn: ({ signal }) => alertsService.getAlert(alertId, { signal }),
    enabled: Boolean(viewerId && alertId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "alerts");
}
