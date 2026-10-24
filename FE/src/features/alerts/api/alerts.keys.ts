import { type AlertQuery } from "@/features/alerts/types/alerts.types";
export const alertsKeys = {
  all: ["alerts"] as const,
  viewer: (viewerId: string) => ["alerts", viewerId] as const,
  listAlerts: (viewerId: string, query: AlertQuery) =>
    ["alerts", viewerId, "listAlerts", query] as const,
  getAlert: (viewerId: string, alertId: string) =>
    ["alerts", viewerId, "getAlert", alertId] as const,
};
