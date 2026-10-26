import type { ViewerId } from "@/types/common";
import { type AlertQuery } from "../types/alerts.types";
export const alertsKeys = {
  all: ["alerts"] as const,
  viewer: (viewerId: ViewerId) => ["alerts", viewerId ?? "anonymous"] as const,
  listAlerts: (viewerId: ViewerId, query: AlertQuery) =>
    [...alertsKeys.viewer(viewerId), "listAlerts", query] as const,
  getAlert: (viewerId: ViewerId, alertId: string) =>
    [...alertsKeys.viewer(viewerId), "getAlert", alertId] as const,
};
