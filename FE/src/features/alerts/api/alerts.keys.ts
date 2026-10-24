// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./alerts.contract";
export const alertsKeys = {
  all: ["alerts"] as const,
  viewer: (viewerId: string) => ["alerts", viewerId] as const,
  listAlerts: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "alerts",
      viewerId,
      "listAlerts",
      params,
      normalizeQuery(contracts.listAlertsContract.query.parse(query)),
    ] as const,
  getAlert: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "alerts",
      viewerId,
      "getAlert",
      params,
      normalizeQuery(contracts.getAlertContract.query.parse(query)),
    ] as const,
};
